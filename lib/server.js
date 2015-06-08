var EventEmitter = require('util').EventEmitter
var net = require('net')
var slice = [].slice

function Server(opts) {
  this.server = new Server()
  EventEmitter.call(this)
}

util.inherits(Server, EventEmitter);

var svr = Server.prototype;

svr.listen = function() {
  this.server.listen.apply(slice.call(arguments), this.server)
  this.server.on('connection', function(socket) {
      svr.emit('connection', new Context(socket, 'server'))
  })
}

module.exports = Server
