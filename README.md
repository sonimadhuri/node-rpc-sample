## File Structure

## Steps to run
1. Install dependencies with `npm i`
2. To start the server run `node wsp-server.js`
3. To test a RPC call, run the client with  `node client-sample.js`

The sample code implements RPC over HTTP, so any client that can make a http request, can be used to test this. sample curl request:  `curl -X POST http://localhost:8080/messages -d '{"methodname":"add","args":{"first_number":1,"second_number":2},"name":"Test"}'`

credits: https://github.com/deleteman/jwhisper