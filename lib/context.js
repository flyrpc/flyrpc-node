var util = require('util')
var EventEmitter = require('event').EventEmitter

function Context(socket, name) {
  this.socket = socket
  this.name = name
  this.install_listeners()
  EventEmitter.call(this)
}

util.inherits(Context, EventEmitter)

var ctx = Context.prototype;

ctx.install_listeners = function() {
  var self = this;

  this.stream.on('connect', function() {
      self.on_connect()
  })

  this.stream.on('packet', function(packet) {
      self.on_packet(packet)
  })

  this.stream.on('error', function(err) {
      self.on_error(err)
  })

  this.stream.on('close', function() {
      self.connection_gone('close')
  })
}

ctx.send_command = function(type, command, buffer) {

  if(this.stream.writeable) {
    this.flush()
  }
}

ctx.flush = function() {
}

module.exports = Context
