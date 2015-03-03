var WebSocket = require('./websocket/WebSocketClient');
var socket = new WebSocket('ws://127.0.0.1:4180');

socket.onopen = function(event) {
	socket.onmessage = function(data) {
		console.log(data.length)
	}
	socket.onclose = function(event) {
		console.log('连接被关闭')
	};	
	socket.onerr = function(err){
		console.log(err)
	}
	socket.send('hello')
}