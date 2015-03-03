var querystring = require('querystring')
var utils = require('./utils');
//在线人数
var online_user = {}

//开局
var open_chess = {}

//消息任务
var message_group = {}

//连接ws
var ws_group = {};

var WebSocketServer = require('./websocket/WebSocketServer');
var ws = new WebSocketServer({
	port: 4180,
	timeout:10000
})

//page
ws.urlHandler('/login', function(req, res) {
	var cookie = utils.cookieParser(req.headers.cookie);
	if (cookie.userName && online_user[cookie.userName]) {
		ws.sendfile('/views/5chess.html', res);
		return
	}
	ws.sendfile('/views/login.html', res);
})

// ws.urlHandler('/', function(req, res) {
// 	var header = {
// 		'Content-Type': 'application/json;charset=utf-8'
// 	}
// 	res.writeHead(200, header);
// 	// ws.sendfile('/views/index.html', res);
// })

ws.urlHandler('/5chess', function(req, res) {
	var cookie = utils.cookieParser(req.headers.cookie);
	var userName = cookie.userName;
	if (!userName) {
		ws.sendfile('/views/login.html', res)
		return
	}
	ws.sendfile('/views/5chess.html', res);
})


ws.urlHandler('/login1', function(req, res) {
	var params;
	req.on('data', function(data) {
		var data = data.toString();
		params = querystring.parse(data);
	})
	req.on('end', function() {
		var userName = params['userName'];
		var json = {
			userName: userName
		}
		online_user[userName] = {
			userName: userName,
			chess_status: 0,
			chess_name: null
		}
		res.setHeader("Set-Cookie", ['userName=' + userName]);
		res.send({
			error: 0,
			userName: userName
		})
	})
})


function checkLogin(userName) {
	if (online_user[userName]) {
		return true;
	}
	return false;
}


var update_userList = function() {
	for (var i in online_user) {
		var ws = queryWS(online_user[i].userName);
		var data = {
			flag: 'userList',
			userList: online_user
		}
		ws.send(JSON.stringify(data))
	}
}

var setWS = function(userName, wss) {
	wss.chess_userName = userName;
	ws_group[userName] = wss
}
var queryWS = function(userName) {
	return ws_group[userName]
}

var userToInitStatus = function(userName) {
	online_user[userName].chess_status = 0;
	online_user[userName].chess_name = null;
	online_user[userName].isSend = null;
	online_user[userName].other_player = null;
}
message_group.login = function(data, ws) {
	var userName = data.userName;
	if (!online_user[userName]) {
		online_user[userName] = {
			userName: userName,
			chess_status: 0,
			chess_name: null
		}
	}
	setWS(userName, ws)

	//连接后发送用户信息
	var user_info = {
		flag: 'user_info',
		user_info: online_user[userName]
	}
	ws.send(JSON.stringify(user_info))
	if (online_user[userName].chess_status == 2) {
		var data = {
			flag: 'chess_info',
			chess_info: open_chess[online_user[userName].chess_name],
			currentUser: userName
		}
		ws.send(JSON.stringify(data))
	}
	update_userList()
}

//发送邀请
message_group.send_invitation = function(data) {
	var sName = data.sName;
	var rName = data.rName;

	//如果用户处于对局中或者等待对局的状态，均不能接受邀请
	if (online_user[sName].chess_status == 1 || online_user[sName].chess_status == 2 || online_user[sName].chess_status == 3) {
		return
	}
	if (online_user[rName].chess_status == 1 || online_user[rName].chess_status == 2 || online_user[rName].chess_status == 3) {
		return
	}
	var ws = queryWS(rName);
	var data = {
		flag: 's_invitation',
		sName: sName
	}

	online_user[sName].chess_status = 1; //等待应答
	online_user[rName].chess_status = 3; //被邀请
	online_user[rName].other_player = sName; //通过这个获取发送者的id
	online_user[rName].isSend = true;
	online_user[sName].other_player = rName; //通过这个获取接受者的id
	online_user[sName].isSend = true;

	ws.send(JSON.stringify(data))

	for (var i in online_user) {
		var ws = queryWS(online_user[i].userName);
		var data = {
			flag: 'userList',
			userList: online_user
		}
		ws.send(JSON.stringify(data))
	}
}


//创建对局
message_group.create_chess = function(data) {
	var startTime = new Date().getTime();
	var sName = data.sName;
	var rName = data.rName;

	var chess_name = sName + "vs" + rName;

	online_user[sName].chess_name = chess_name;
	online_user[rName].chess_name = chess_name;

	online_user[sName].chess_status = 2;
	online_user[rName].chess_status = 2;

	var chess = new Array();
	for (var i = 0; i < 2; i++) {
		chess[i] = new Array()
		for (var j = 0; j < 15; j++) {
			chess[i][j] = new Array;
			for (var k = 0; k < 15; k++) {
				chess[i][j][k] = 0
			}
		}
	}
	var data = {
		flag: 'create_chess',
		chess_name: chess_name,
		sName: sName,
		rName: rName,
		t: startTime,
		chess: chess,
		last_play_color: 'white'
	}
	open_chess[chess_name] = data;
	queryWS(sName).send(JSON.stringify(data));
	queryWS(rName).send(JSON.stringify(data));

	update_userList();
}

//取消邀请或者拒绝邀请
message_group.cancel_inv = function(data) {
	var userName = data.userName;
	var other_player = online_user[userName].other_player;
	online_user[userName].chess_status = 0;
	online_user[other_player].chess_status = 0;
	var data = {
		flag: 'cancel_chess'
	}
	queryWS(userName).send(JSON.stringify(data))
	queryWS(other_player).send(JSON.stringify(data))
	update_userList()
}

//下子
message_group.play_chess = function(data) {
	var chess_color = data.chess_color;
	var x_line = data.x_line - 1;
	var y_line = data.y_line - 1;
	var chess_name = data.chess_name;
	var play_user = data.play_user;
	//对局还没开始，不能下子
	if (!open_chess[chess_name]) {
		//对局不存在
		return
	}
	var data = {
		flag: 'play_chess',
		chess_color: chess_color,
		x_line: x_line + 1,
		y_line: y_line + 1
	}
	if (open_chess[chess_name].chess[1][x_line][y_line] == 1) {
		return //棋子位置重复
	}
	if (open_chess[chess_name].chess[0][x_line][y_line] == 1) {
		return //棋子位置重复
	}
	var color_flag = -1;
	if (chess_color == 'black') {
		color_flag = 0
		open_chess[chess_name].last_play_color = 'black'
	}
	if (chess_color == 'white') {
		color_flag = 1;
		open_chess[chess_name].last_play_color = 'white'
	}

	open_chess[chess_name].chess[color_flag][x_line][y_line] = 1
	queryWS(open_chess[chess_name].sName).send(JSON.stringify(data))
	queryWS(open_chess[chess_name].rName).send(JSON.stringify(data))
	if (isWin(open_chess[chess_name].chess, color_flag, x_line, y_line)) {
		var data = {
			flag: 'isWin',
			winUser: play_user
		}

		queryWS(open_chess[chess_name].sName).send(JSON.stringify(data))
		queryWS(open_chess[chess_name].rName).send(JSON.stringify(data))

		userToInitStatus(open_chess[chess_name].sName)
		userToInitStatus(open_chess[chess_name].rName)

		delete open_chess[chess_name]
		update_userList()
	}
}
message_group.close = function(data) {
	var userName = data.chess_userName;
	if (online_user[userName] && online_user[userName].chess_status == 0) {
		delete online_user[userName];
		update_userList()
	}
	console.log('连接断开')
}
message_group.send_lost = function(data) {
	var chess_name = data.chess_name;
	var lost_name = data.lost_name;

	var data = {
		flag: 'isLost',
		lostUser: lost_name
	}

	queryWS(open_chess[chess_name].sName).send(JSON.stringify(data))
	queryWS(open_chess[chess_name].rName).send(JSON.stringify(data))

	userToInitStatus(open_chess[chess_name].sName)
	userToInitStatus(open_chess[chess_name].rName)

	delete open_chess[chess_name]

	update_userList();
}

function isWin(arr, color, x, y) {
	var count = 0;
	var flag_x = x;
	var flag_y = y;
	while (x < 14) {
		if (arr[color][x + 1][y] == 1) {
			count++;
		} else {
			break;
		}
		x++;
	}
	x = flag_x;
	y = flag_y;
	while (x > 0) {
		if (arr[color][x - 1][y] == 1) {
			count++;
		} else {
			break;
		}
		x--;
	}
	if (count >= 4) {
		return true;
	}
	count = 0;
	while (y < 14) {
		if (arr[color][x][y + 1] == 1) {
			count++;
		} else {
			break;
		}
		y++;
	}
	x = flag_x;
	y = flag_y;
	while (y > 0) {
		if (arr[color][x][y - 1] == 1) {
			count++;
		} else {
			break;
		}
		y--;
	}
	if (count >= 4) {
		return true;
	}
	count = 0;
	while (y < 14 && x < 14) {
		if (arr[color][x + 1][y + 1] == 1) {
			count++;
		} else {
			break;
		}
		x++;
		y++;
	}
	x = flag_x;
	y = flag_y;
	while (y > 0 && x > 0) {
		if (arr[color][x - 1][y - 1] == 1) {
			count++;
		} else {
			break;
		}
		x--;
		y--;
	}
	if (count >= 4) {
		return true;
	}
	count = 0;
	while (y < 14 && x > 0) {
		if (arr[color][x - 1][y + 1] == 1) {
			count++;
		} else {
			break;
		}
		x--;
		y++;
	}
	x = flag_x;
	y = flag_y;
	while (y > 0 && x < 14) {
		if (arr[color][x + 1][y - 1] == 1) {
			count++;
		} else {
			break;
		}
		x++;
		y--;
	}

	if (count >= 4) {
		return true;
	}
	return false;
}
ws.on('connection', function(_ws) {
	_ws.on('message', function(data) {
		try {
			var data = JSON.parse(data)
			if (message_group[data.flag]) {
				message_group[data.flag](data, _ws)
			}
		} catch (e) {
			// console.log(e)
		}
	})
	_ws.on('close', function() {
		var userName = _ws.chess_userName;
		console.log(_ws)
		if (online_user[userName] && online_user[userName].chess_status == 0) {
			delete online_user[userName];
			update_userList()
		}
		console.log('连接断开')
	})
})