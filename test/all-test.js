var Server = require('../lib/server.js').Server
var Client = require('../lib/client.js').Client

var server = new Server();
server.on('connection', function(conn) {
    console.log('server on new connections')
    conn.on('message', function(code, payload) {
        console.log('server recv message', code, payload.toString())
    })

    conn.on('request', function(code, payload, reply) {
        console.log('server recv request', code, payload.toString())
        reply('what are', 'you talking about')
    })
})
server.listen(5678)

var client = new Client();
client.connect(5678)
client.on('connect', function() {
    console.log('client connected')
    client.send('', '')
    client.request('hello', 'world', function(err, response) {
        console.log('client recv error', err)
        console.log('client recv response', response)
    })
})
