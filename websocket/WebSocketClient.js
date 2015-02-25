var http = require('http')
var crypto = require('crypto')
var url = require('url')
var Sender = require('./Sender')
var Receiver = require('./Receiver')
function WebSocket(hostname) {
	var urlJson = url.parse(hostname)
	var self = this;
	self.host = urlJson.host;
	self.hostname = urlJson.hostname;
	self.port = urlJson.port;
	var key = new Buffer(13 + '-' + Date.now()).toString('base64');
	var shasum = crypto.createHash('sha1');
	shasum.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
	var expectedServerKey = shasum.digest('base64');
	var options = {
		hostname: self.hostname,
		port: self.port,
		headers: {
			"Connection": "Upgrade",
			"Host": self.host,
			"Origin": self.host,
			"Sec-WebSocket-Key": key,
			"Sec-WebSocket-Version": 13,
			"Upgrade": "websocket"
		}
	};
	var req = http.request(options);
	req.on('upgrade', function(res, socket, upgradeHead) {
		self.sender = new Sender(socket, true)
		self.receiver = new Receiver()
		self.receiver.ontext = function(data){
			self.onmessage(data)
		}
		self.onopen()
		if (upgradeHead && upgradeHead.length > 0) {
			dataHandle(upgradeHead)
		}
		socket.on('data', dataHandle)

		function dataHandle(data) {
			self.receiver.clientParse(data)
			self.receiver.pong = function(){
				self.sender.pong();
			}
		}
		socket.on('close',function(data){
			self.onclose(data)
		})
	})
	req.end();
}

WebSocket.prototype.send = function(data){
	this.sender.send(data)
}


module.exports = WebSocket;