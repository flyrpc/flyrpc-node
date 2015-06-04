var headSize = 2;

/**
 * @param {Socket} socket  auto handle 'data' event, and emit 'packet' event.
 */
function autoParsePacket(socket) {

  var STATE_HEAD = 0;
  var STATE_BODY = 1;

  var state = STATE_HEAD;

  var headOffset = 0;
  // init headBuffer, we can reuse it cause it is fixed size.
  var headBuffer = new Buffer(headSize);

  var packetSize = 0;
  var packetOffset = 0;
  var packetBuffer;

  socket.on('data', function (data) {
    // data reading offset
    var offset = 0, end = data.length;
    // not read to the end
    while(offset < end) {
      if(state == STATE_HEAD) {
        offset = parseHead(data, offset);
      } else if (state == STATE_BODY) {
        offset = parseBody(data, offset);
      }
    }
  });

  // read headBuffer from data start from offset.
  // if ready init packetBuffer by headBuffer.
  function parseHead(data, offset) {
    var headEnd = Math.min(data.length, offset + headSize - headOffset);
    data.copy(headBuffer, headOffset, offset, headEnd);
    headOffset += (headEnd - offset);
    if(headOffset === headSize) {
      packetSize = headBuffer.readUInt16BE(0)
      packetBuffer = new Buffer(packetSize);
      packetOffset = 0;
      state = STATE_BODY;
    }
    return headEnd;
  }

  // read packetBuffer from data start from offset
  // if ready read next packet head.
  function parseBody(data, offset) {
    var bodyEnd = Math.min(data.length, offset + packetSize - packetOffset);
    data.copy(packetBuffer, packetOffset, offset, bodyEnd);
    packetOffset += (bodyEnd - offset);
    if(packetOffset == packetSize) {
      socket.emit('packet', packetBuffer);
      headOffset = 0;
      packetOffset = 0;
      packetSize = 0;
      packetBuffer = null;
      state = STATE_HEAD;
    }
    return bodyEnd;
  }
}
