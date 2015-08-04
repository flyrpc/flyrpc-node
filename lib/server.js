var EventEmitter = require('events').EventEmitter
var net = require('net')
var util = require('util')
var conn = require('./conn')

function Server(opts, handler) {
  EventEmitter.call(this)
  this.opts = opts
  this.socketServer = net.createServer(this.opts, this.onConnection.bind(this))
  if(handler) {
    this.on('connection', handler)
  }
}
util.inherits(Server, EventEmitter)
exports.Server = Server

var svr = Server.prototype;

// event handlers
svr.onConnection = function(socket) {
  this.emit('connection', new conn.Connection(socket))
}

// listen
svr.listen = function() {
  this.socketServer.listen.apply(this.socketServer, arguments)
}
