var net = require('net')

describe('protocol', function() {
    var echoServer, socket
    var receivedPackets = []

    before(function(done) {
        echoServer = net.createServer(function(sock) {
            sock.on('data', function(data) {
                sock.write(data)
            })
        })
        echoServer.listen(18000)
        var socket = net.connect(18000, done)
    })

    it('should parse packet', function() {

    })
})
