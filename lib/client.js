var util = require('util')
var EventEmitter = require('event').EventEmitter


function Client(stream, opts) {
  this.stream = stream
  this.install_listeners()
  EventEmitter.call(this)
}

util.inherits(Client, EventEmitter)

var client = Client.prototype;

