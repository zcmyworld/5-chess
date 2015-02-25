function Sender(socket, mask) {
	this.socket = socket
	if(mask){
		this.mask = true;
	}
}

Sender.prototype.send = function(data) {
	var opcode = 0x1;
	var socket = this.socket;
	data = new Buffer(data);
	var dataLength = data.length;
	var dataOffset = this.mask ? 6: 2;
	
	var payloadLen = dataLength;

	if (dataLength >= 65536) {
		dataOffset += 8;
		payloadLen = 127;
	} else if (dataLength > 125) {
		dataOffset += 2; //2字节Extended payload length
		payloadLen = 126;
	}
	var totalLength = dataLength + dataOffset;
	if (dataLength >= 65536) {
		totalLength = dataOffset
	}
	var outputBuffer = new Buffer(totalLength);

	outputBuffer[0] = 0x80 | opcode;
	outputBuffer[1] = payloadLen; //代表mask和数据长度
	if (payloadLen == 126) {
		outputBuffer[2] = (dataLength & 0xff00) >> 8
		outputBuffer[3] = dataLength & 0xff
	}
	if (payloadLen == 127) {
		outputBuffer[2] = (dataLength & 0xff00000000000000) >> 512
		outputBuffer[3] = (dataLength & 0xff000000000000) >> 256
		outputBuffer[4] = (dataLength & 0xff0000000000) >> 128
		outputBuffer[5] = (dataLength & 0xff00000000) >> 64
		outputBuffer[6] = (dataLength & 0xff000000) >> 32
		outputBuffer[7] = (dataLength & 0xff0000) >> 16
		outputBuffer[8] = (dataLength & 0xff00) >> 8
		outputBuffer[9] = dataLength & 0xff
	}

	if (this.mask) {
		var mask_key = getRandomMask();
		outputBuffer[dataOffset - 4] = mask_key[0];
		outputBuffer[dataOffset - 3] = mask_key[1];
		outputBuffer[dataOffset - 2] = mask_key[2];
		outputBuffer[dataOffset - 1] = mask_key[3];

		if (dataLength >= 65536) {
			doMask(data, mask_key, data, 0, dataLength);
			socket.write(outputBuffer, 'binary');
			socket.write(data, 'binary');
		} else {
			doMask(data, mask_key, outputBuffer, dataOffset, dataLength);
			socket.write(outputBuffer, 'binary');
		}
	} else {
		if (dataLength >= 65536) {
			socket.write(outputBuffer, 'binary');
			socket.write(data, 'binary')
		} else {
			data.copy(outputBuffer, dataOffset); //用data从outputBuffer的第2位开始覆盖其数据
			socket.write(outputBuffer, 'binary'); //将数据以二进制格式传到客户端	
		}
	}
}
Sender.prototype.ping = function() {
	var opcode = 0x9;
	var data = "ping";
	var socket = this.socket;
	data = new Buffer(data);
	var dataLength = data.length;
	var dataOffset = 2; 
	var payloadLen = dataLength; 
	var totalLength = dataLength + dataOffset;
	var outputBuffer = new Buffer(totalLength);
	outputBuffer[0] = 0x80 | opcode; 
	outputBuffer[1] = payloadLen; 
	data.copy(outputBuffer, dataOffset);
	socket.write(outputBuffer, 'binary');
}
Sender.prototype.pong = function() {
	var opcode = 0xA;
	var data = "pong";
	var socket = this.socket;
	data = new Buffer(data);
	var dataLength = data.length;
	var dataOffset = 2; 
	var payloadLen = dataLength; 
	var totalLength = dataLength + dataOffset;
	var outputBuffer = new Buffer(totalLength);
	outputBuffer[0] = 0x80 | opcode; 
	outputBuffer[1] = payloadLen; 
	data.copy(outputBuffer, dataOffset); 
	socket.write(outputBuffer, 'binary');
}


function getRandomMask() {
	return new Buffer([~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255)]);
}

function doMask(source, mask, output, offset, length) {
	var maskNum = mask.readUInt32LE(0, true);
	var i = 0;
	for (; i < length - 3; i += 4) {
		var num = maskNum ^ source.readUInt32LE(i, true);
		if (num < 0) num = 4294967296 + num;
		output.writeUInt32LE(num, offset + i, true);
	}

	switch (length % 4) {
		case 3:
			output[offset + i + 2] = source[i + 2] ^ mask[2];
		case 2:
			output[offset + i + 1] = source[i + 1] ^ mask[1];
		case 1:
			output[offset + i] = source[i] ^ mask[0];
	}
}
module.exports = Sender;