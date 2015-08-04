var net = require('net')
var util = require('util')
var conn = require('./conn')

function Client(opts) {
  var socket = new net.Socket(opts)
  conn.Connection.call(this, socket)
  this.socket = socket;
}
util.inherits(Client, conn.Connection)

exports.Client = Client;

var proto = Client.prototype;

proto.connect = function(port, host) {
  this.socket.connect(port, host)
}
