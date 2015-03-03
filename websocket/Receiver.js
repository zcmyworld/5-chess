var Sender  = require('./Sender')
function Recevier() {
	var self = this;
	self.isBig = false;
	self.bigData = [];
	self.totalLength = 0
	self.maskArr = []
	self.ontext = function() {}
	self.pong = function(){}
	self.onclose = function(){}
	// self.on_pong = 
}

Recevier.prototype.clientParse = function(data) {
	if(data[0].toString(2).slice(4) == 1001){//ping
		console.log('ping')
		this.pong()
		return
	}
	var self = this;
	if (self.isBig) {
		var flagLength = 0;
		if (flagLength < self.totalLength) {
			self.bigData.push(data)
		}
		for (var i in self.bigData) {
			flagLength += self.bigData[i].length
		}
		if (flagLength == self.totalLength) {
			var Payload_data = Buffer.concat(self.bigData);
			self.ontext(Payload_data.toString())
			self.isBig = false;
			self.isData = []
		}
		return;
	}
	var payloadLen = data[1] & 0x7f;
	if (payloadLen < 126) {
		var Payload_data = data.slice(2).toString()
		self.ontext(Payload_data.toString())
	}
	if (payloadLen == 126) {
		var Payload_data = data.slice(4).toString()
		self.ontext(Payload_data.toString())
	}
	if (payloadLen == 127) {
		self.totalLength = parseTotalLength(data);
		self.bigData.push(data.slice(10))
		self.isBig = true;
		return
	}
}
Recevier.prototype.parse = function(data) {
	
	var self = this;
	
	if (data[0].toString(2).slice(4) == 1000) {
		console.log('连接关闭')
		self.onclose()
		return
	}
	
	if (data[0].toString(2).slice(4) == 1010) {
		console.log('pong')
		return
	}

	var payloadLen = data[1] & 0x7f;
	if (self.isBig) {
		var flagLength = 0;
		if (flagLength < self.totalLength) {
			self.bigData.push(data)
		}
		for (var i in self.bigData) {
			flagLength += self.bigData[i].length
		}
		if (flagLength == self.totalLength) {
			var Payload_data = Buffer.concat(self.bigData);
			var mask_key = self.maskArr[0]
			for (var i = 0; i < Payload_data.length; i++) {
				Payload_data[i] = Payload_data[i] ^ mask_key[i % 4];
			}
			self.ontext(Payload_data.toString())
			self.bigData = []
			self.isBig = false;
		}
		return;
	}

	if (payloadLen < 126) {
		var mask_key = data.slice(2, 6)
		var Payload_data = data.slice(6)
	}
	if (payloadLen == 126) {
		mask_key = data.slice(4, 8);
		Payload_data = data.slice(8)
	}
	if (payloadLen == 127) {
		self.totalLength = parseTotalLength(data);
		self.isBig = true;
		var mask_key = data.slice(10, 14)
		self.maskArr.push(mask_key)
		self.bigData.push(data.slice(14))
		return
	}
	for (var i = 0; i < Payload_data.length; i++) {
		Payload_data[i] = Payload_data[i] ^ mask_key[i % 4];
	}
	self.ontext(Payload_data.toString())
}

function parseTotalLength(data) {
	var totalLength = 0;
	totalLength += parseInt(data[9].toString())
	totalLength += parseInt((data[8] << 8).toString())
	totalLength += parseInt((data[7] << 16).toString())
	totalLength += parseInt((data[6] << 32).toString())
	totalLength += parseInt((data[5] << 64).toString())
	totalLength += parseInt((data[4] << 128).toString())
	totalLength += parseInt((data[3] << 256).toString())
	totalLength += parseInt((data[2] << 512).toString())
	return totalLength;
}
module.exports = Recevier;