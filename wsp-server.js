const Server = require('./lib/web-service');

class Test {
  constructor() {}

  add(a, b) {
    console.log('Adding numbers: ', a, b);
    return a + b;
  }

  mult(a, b) {
    return a * b;
  }
}

let services = {
  Test: {
    service_class: Test,
    methods: {
      add: {
        doc_lines: ['Adds 2 numbers'],
        params: {
          first_number: {
            def_order: 1,
            doc_lines: ['first number to add'],
            type: 'number',
            optional: false
          },
          second_number: {
            def_order: 2,
            doc_lines: ['second number to add'],
            type: 'number',
            optional: false
          }
        },
        ret_info: {
          doc_lines: ['the result of the addition '],
          type: ['number']
        }
      }
    }
  }
};

let types = {};

const myServer = new Server({
  specs: {
    servicename: 'Test Service'
  },
  services: services,
  types: types
});

myServer.start(8080);
