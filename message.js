var core = require('./core')
exports.MESSAGE_BUFFER = {};
exports.QUERY_CALLBACKS = {};

function Message() {}
exports.Message = Message;

var session = require('./session')

Message.prototype.createBuffer = function(session_id) {
	if (!exports.MESSAGE_BUFFER[session_id]) {
		exports.MESSAGE_BUFFER[session_id] = [];
	}
}
Message.prototype.query = function(session_id, callback) {
	exports.QUERY_CALLBACKS[session_id] = callback;
	this.emptyBuffer(session_id, callback);
}
Message.prototype.writeBuffer = function(session_id, opt_msg) {
	this.createBuffer(session_id);
	for (var i in opt_msg) {
		var msg = new Buffer(JSON.stringify(opt_msg[i]));
		exports.MESSAGE_BUFFER[session_id].push(msg)
	}
}
Message.prototype.emptyBuffer = function(session_id, callback) {
	if (exports.MESSAGE_BUFFER[session_id] && exports.MESSAGE_BUFFER[session_id].length) {
		var tmp = exports.MESSAGE_BUFFER[session_id];
		exports.MESSAGE_BUFFER[session_id] = [];
		for (var i in tmp) {
			tmp[i] = JSON.parse(tmp[i].toString());
		}
		callback(tmp)
	}
}
Message.prototype.deleteQueryBack = function(session_id) {
	if (session_id) {
		delete exports.QUERY_CALLBACKS[session_id]
	}
}
Message.prototype.deleteBuffer = function(session_id) {
	if (session_id) {
		delete exports.MESSAGE_BUFFER[session_id]
	}
}
Message.prototype.output = function(uid, msg, session_id) {
	var message_obj = new Message();
	if (uid) {
		var session_list = session.USERS[uid].ss;
	} else {
		var session_list = {};
		session_list[session_id] = 1;
	}

	for (var session_id in session_list) {
		if (exports.QUERY_CALLBACKS[session_id]) {
			var callback = exports.QUERY_CALLBACKS[session_id];
			callback(msg)
		} else {
			this.writeBuffer(session_id, msg);
		}
	}
}

exports.subscribeMsg = function(str) {
	var msg = JSON.parse(str);
	var to_id = msg.tid;
	var message_obj = new Message();
	var to_type = msg.tt;
	var fid = msg.fid; //发送者的uid
	var fsid = msg.fsid; //发送者的session_id
	for (var session_id in session.USERS[fid].ss) {
		if (session_id != fsid) {
			message_obj.output(null, msg, session_id)
		}
	}
	if (to_type == core.RECV_TYPE.user) { //发送给单人
		message_obj.output(to_id, msg)
	} else if (to_type == core.RECV_TYPE.group) { //发送给群
		for (var uid in session.GROUPS[to_id]) {
			message_obj.output(uid, msg)
		}
	}
}