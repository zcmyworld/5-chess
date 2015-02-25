var EventEmitter = require('events').EventEmitter;
var util = require('util');
var http = require('http');
var crypto = require('crypto');
var Sender = require('./Sender');
var Receiver = require('./Receiver');
var fs = require('fs')
var path = require('path')

function WebSocketServer(options) {
	EventEmitter.call(this)
	var self = this;
	options.port = options.port || 3000;
	this.server = http.createServer(function(req, res) {
		res.send = function(json){
			var header = {
				"Content-Type":"application/json"
			}
			res.writeHead(200,header);
			res.end(JSON.stringify(json));
		}
		var url_path = req.url;
		if (url_groups[url_path]) {
			url_groups[url_path](req, res)
			return
		}
		if (!self.sendfile(url_path, res)) {
			return
		}
		var header = {
			'Content-Type': 'text/plain'
		}
		res.writeHead(404, header);
		res.end('404');
	});
	this.server.listen(options.port)
	console.log('server start')
	if (options.timeout) {
		this.server.timeout = options.timeout //defult:12000
	}
	var opts = {}
	opts.timeout = this.server.timeout || 12000
	this.server.on('upgrade', function(req, socket, body) {
		req.connection.on('close', function() {
			self.emit('close')
		})

		establishConnection(req, socket, body)
		var handler = new Handler(req, socket, body, opts);
		self.emit('connection', handler)
	});
};
util.inherits(WebSocketServer, EventEmitter);


var url_groups = {};

WebSocketServer.prototype.urlHandler = function(url_path, handler) {
	url_groups[url_path] = handler
}
var mimes = {
	"css": "text/css",
	"gif": "image/gif",
	"html": "text/html",
	"ico": "image/x-icon",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"js": "text/javascript",
	"json": "application/json",
	"pdf": "application/pdf",
	"png": "image/png",
	"svg": "image/svg+xml",
	"swf": "application/x-shockwave-flash",
	"tiff": "image/tiff",
	"txt": "text/plain",
	"wav": "audio/x-wav",
	"wma": "audio/x-ms-wma",
	"wmv": "video/x-ms-wmv",
	"xml": "text/xml"
};

WebSocketServer.prototype.sendfile = function(filename, res) {
	var url_path = __dirname + '/..' + filename
	var ext = path.extname(url_path);
	ext = ext ? ext.slice(1) : 'unknown';
	var header = {
		'Content-Type': mimes[ext]
	}
	if(ext == 'unknown'){
		return true;
	}
	if (!fs.existsSync(url_path)) {
		console.log('file not exist');
		return true;
	}
	fs.readFile(url_path, function(err, file) {
		if (err) {
			console.log(err)
			return
		}
		res.writeHead(200,header);
		res.write(file.toString())
		res.end();
	})
}

function establishConnection(req, socket, body) {
	var key = req.headers['sec-websocket-key'];
	var shasum = crypto.createHash('sha1');
	shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
	key = shasum.digest('base64');
	var headers = [
		'HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', 'Sec-WebSocket-Accept: ' + key
	];
	socket.write(headers.concat('', '').join('\r\n'));
}

function Handler(req, socket, body, opts) {
	EventEmitter.call(this)
	var self = this;
	self.sender = new Sender(socket);
	self.receiver = new Receiver(true);
	if (opts.timeout > 3000) { //debug
		setInterval(function() {
			self.sender.ping()
		}, 5000)
	}
	self.receiver.ontext = function(data) {
		self.emit('message', data)
	}
	socket.on('data', function(data) {
		self.receiver.parse(data)
	})
}

util.inherits(Handler, EventEmitter);
Handler.prototype.send = function(data) {
	this.sender.send(data)
}


module.exports = WebSocketServer;