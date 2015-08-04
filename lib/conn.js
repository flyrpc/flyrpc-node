var EventEmitter = require('events').EventEmitter
var util = require('util')

var STATE_HEAD = 0;
var STATE_CODE = 1;
var STATE_LENGTH = 2;
var STATE_PAYLOAD = 3;
var FLAG_REQUEST = 0x40;
var FLAG_RESPONSE = 0x80;

function Connection(socket) {
  EventEmitter.call(this)
  this.socket = socket;
  this.nextSeq = 1;
  this._initNextPacket();

  this.waitReplys = {}

  this.socket.on('connect', this.onConnect.bind(this));
  this.socket.on('data', this.onData.bind(this));
  this.socket.on('close', this.onClose.bind(this));
  this.socket.on('error', this.onError.bind(this));
}
util.inherits(Connection, EventEmitter)

exports.Connection = Connection

var proto = Connection.prototype;
// ------------- public methods --------------

proto.send = function(code, payload) {
  this._sendPacket({
      flag: 0,
      seq: 0,
      code: code,
      payload: payload
  })
}

proto.request = function(code, payload, timeout, callback) {
  if(!callback) {
    callback = timeout
    timeout = 5000
  }
  var seq = this.nextSeq ++ ;
  if(this.nextSeq >= 0xffff) {
    this.nextSeq = 1;
  }
  this._sendPacket({
      flag: FLAG_REQUEST,
      seq: seq,
      code: code,
      payload: payload
  })
  var self = this

  var timer = setTimeout(function() {
      if(self.waitReplys[seq]) {
        var err = new Error('request_timeout:' + code)
        err.code = 'TIME_OUT'
        reply(err)
      }
  }, timeout)

  function reply(err, result) {
    callback(err, result)
    delete self.waitReplys[seq]
    if(timer) {
      clearTimeout(timer)
    }
  }

  this.waitReplys[seq] = reply
}

proto._sendPacket = function(packet) {
  var payload = packet.payload
  if(!Buffer.isBuffer(payload)) {
    payload = new Buffer(payload)
  }
  var length = payload.length;
  var powOfLength = 0
  if(length > 0xffffffff) {
    powOfLength = 3
  } else if(length > 0xffff) {
    powOfLength = 2
  } else if(length > 0xff) {
    powOfLength = 1
  }
  var flag = packet.flag | powOfLength;
  var headBuff = new Buffer(3)
  headBuff.writeUInt8(flag, 0)
  headBuff.writeUInt16BE(packet.seq, 1)
  var codeBuff = new Buffer(packet.code)
  var zeroBuff = new Buffer([0x00])
  var lengthBuff = new Buffer(1 << powOfLength)
  lengthBuff.writeUIntBE(length, 0, 1 << powOfLength)
  var buff = Buffer.concat([headBuff, codeBuff, zeroBuff, lengthBuff, payload])
  console.log('write buff', buff)
  this.socket.write(buff)
}

// ------------- event handlers --------------
proto.onConnect = function() {
  this.emit('connect', this)
}

proto.onData = function(data) {
  console.log('on data', data)
  var offset = 0, end = data.length;
  while(offset < end) {
    offset = this._parse(data, offset);
  }
}

proto.onClose = function() {
  this.emit('close');
}

proto.onError = function(err) {
  this.emit('error', err)
}

proto.onPacket = function(packet) {
  console.log('on packet', packet)
  if(packet.flag & FLAG_RESPONSE) {
    var reply = this.waitReplys[packet.seq]
    if(reply) {
      reply(null, packet)
    }
  } else if(packet.flag & FLAG_REQUEST) {
    var self = this;
    this.emit('request', packet.code, packet.payload, function reply(code, payload) {
        self._sendPacket({
            flag: FLAG_RESPONSE,
            seq: packet.seq,
            code: code,
            payload: payload
        })
    })
  } else {
    this.emit('message', packet.code, packet.payload)
  }
}

proto._initNextPacket = function() {
      // read next packet
      this.currentPacket = {
        flag: 0,
        seq: 0,
        length: 0,
        sizeOfLength: 0,
        code: null,
        payload: null
      }
      // read head
      this.state = STATE_HEAD;
      this._codeChunks = [];
      this._buffer = new Buffer(3)
      this._bufferOffset = 0;
}

proto._parse = function(data, offset) {
  if(this.state == STATE_CODE) {
    for(var i=offset;i<data.length;i++) {
      if(data[i] == 0x00) {
        this._codeChunks.push(data.slice(offset, i))
        this.currentPacket.code = Buffer.concat(this._codeChunks).toString('utf8')
        // read next field, length
        this._buffer = new Buffer(this.currentPacket.sizeOfLength)
        this._bufferOffset = 0;
        this.state = STATE_LENGTH
        return i+1;
      }
    }
    this._codeChunks.push(data);
    return data.length;
  }

  var bufferSize = this._buffer.length;
  var parseEnd = Math.min(data.length, offset + bufferSize - this._bufferOffset);
  data.copy(this._buffer, this._bufferOffset, offset, parseEnd);
  this._bufferOffset += parseEnd - offset;

  if(this._bufferOffset === bufferSize) {
    // read buffer full.
    if(this.state == STATE_HEAD) {
      this.currentPacket.flag = this._buffer.readUInt8(0);
      this.currentPacket.seq = this._buffer.readUInt16BE(1);
      this.currentPacket.sizeOfLength = 1 << (this.currentPacket.flag & 0x3)
      // read next, code
      this.state = STATE_CODE;
    } else if(this.state == STATE_LENGTH) {
      this.currentPacket.length = this._buffer.readUIntBE(0, this.currentPacket.sizeOfLength);
      // read next field, payload
      this.state = STATE_PAYLOAD
      this._buffer = new Buffer(this.currentPacket.length);
      this._bufferOffset = 0;
    } else if(this.state == STATE_PAYLOAD) {
      // emit packet
      this.currentPacket.payload = this._buffer;
      this.onPacket(this.currentPacket)
      this._initNextPacket()
    }
  }
  return parseEnd;
}

