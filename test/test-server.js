var expect = require('chai').expect

describe('all-test', function() {
    var client
    before(function() {
        var server = createServer()
        server.handle('hello', function*() {
            // this is context
            return 'hello ' + this.params.name
        })

        server.handle('throw-error', function*() {
            throw new Error('what the fuck')
        })

        server.handle('return int', function*() {
            return 1
        })

        server.handle('return obj', function*() {
            return {
              hello: 'world'
            }
        })

        server.handle('return string', function*() {
            return 'hello world'
        })

        server.handle('just send', function*() {
            console.log('do something but no-reply')
        })

        server.on('connection', function(conn){
            yield conn.call('hello', 'client')
        })

        server.listen(18000)
    })

    it('should handle new connection', function(done) {
        client = createClient(18000)
        client.handle('hello', function*() {
            deon()
            return 'hello' + this.params.name
        })
    })

    it('should handle params', function(done) {
        var reply = yield client.call('hello', {name: 'world'})
        expect(reply).to.be.eql('hello world')
    })

    it('shoudl throw error', function(done) {
    })

})
