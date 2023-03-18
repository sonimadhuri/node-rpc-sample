const http = require('http');
const { EventEmitter } = require('stream');
const config = require('config');

class Server extends EventEmitter {
  constructor({ specs, services, types }) {
    super();
    this.specs = {};
    this.specs.type = config.get('wsp.type');
    this.specs.version = config.get('wsp.version');

    this.services = services;
    this.types = types;
  }

  start(port) {
    this.server = http.createServer( this.parseMsg.bind(this));
    this.server.listen(port, () => {
      this.setupServices();
      console.log(`Server started at port:${port}`);
    });
  }

  setupServices() {
    let serviceKeys = Object.keys(this.services);

    serviceKeys.forEach((k) => {
      let service = new Service(k, this.services[k]);
      service.subscribeToMethods(this);
    });
  }

  // returns array of meta data for each service
  rootEndpoint(res) {
    res.setHeader('content-type', 'application/json');
    let sName = Object.keys(this.services)[0];
    let responseJSON = {
      type: this.specs.type,
      version: this.specs.version,
      types: this.types,
      serviceName: sName,
      methods: this.services[sName].methods
    };
    res.end(JSON.stringify(responseJSON));
  }

  unmarshall(rawData) {
    let u = null;
    u = JSON.parse(rawData);

    let required = ['args', 'methodname', 'name'];

    let missingParams = required.filter((p) => !u[p]);

    if (missingParams.length > 0) {
      throw new Error(
        "Missing '" +
          missingParams.join("','") +
          "' from the properties of the message"
      );
    }

    return u;
  }

  // request listener
  parseMsg(req, res) {
    const { method, url } = req;
    console.log('Parsing message...');
    console.log(method, typeof method);
    console.log(url);

    if (method.toUpperCase() != 'POST') {
      res.statusCode = 400;
      res.end('Invalid method');
      return false;
    }

    // only one endpoint is open to receive requests for server
    if (url.toLowerCase() == config.get('wsp.message_endpoint')) {
      let buffer = [];
      req
        .on('data', (chunk) => {
          buffer.push(chunk);
        })
        .on('end', (_) => {
          buffer = Buffer.concat(buffer).toString();
          let unmarshalled = null;
          try {
            unmarshalled = this.unmarshall(buffer);
          } catch (e) {
            res.statusCode = 500;
            return res.end('Error unmarshalling message: ' + e);
          }

          let eventKey = unmarshalled.name + '_' + unmarshalled.methodname;
          this.emit(eventKey, { res, ...unmarshalled.args });
        });
    } else {
      return this.rootEndpoint(res);
    }
  }
}

class Service {
  constructor(serviceName, meta) {
    this.class = meta.service_class;
    this.methods = meta.methods;
    // this.params =
    this.name = serviceName;
  }

  // attaching event listeners, so that based on the subroutine name the respective method can be called
  subscribeToMethods(emitter) {
    let methodNames = Object.keys(this.methods);

    let instance = new this.class();

    methodNames.forEach((m) => {
      let eventKey = this.name + '_' + m;
      console.log('Subscribing to %s', eventKey);
      emitter.on(eventKey, ({ res, ...args }) => {
        //function to execute once the client sends the request
        let params = Object.keys(this.methods[m].params);
        let paramValues = params.map((p) => args[p]);

        //execute method
        let result = instance[m].apply(instance, paramValues);

        let jsonRes = {
          res: {
            type: this.methods[m].ret_info.type,
            value: result
          }
        };
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(jsonRes));
      });
    });
  }
}

module.exports = Server;
