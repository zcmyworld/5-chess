var message_group = {}

$(document).ready(function() {
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	draw_board()
	setCurrentUser();
	c.addEventListener("click", click_event_handle, false)
	message_group.userList = function(data) {
		$(".userList_ele").remove()
		for (var i in data.userList) {
			if (data.userList[i].chess_status == 0) {
				data.userList[i].chess_status = "<span class='ue_status'>空闲</span>"
			}
			if (data.userList[i].chess_status == 1 || data.userList[i].chess_status == 3) {
				data.userList[i].chess_status = "<span class='ue_status' style='color:red;'>等待对局</span>"
			}
			if (data.userList[i].chess_status == 2) {
				data.userList[i].chess_status = "<span class='ue_status' style='color:red;'>对局中</span>"
			}
			var html = "<div class='userList_ele'>" +
				"<span class='ue_userName'>" + data.userList[i].userName + "</span>" + data.userList[i].chess_status +
				"</div>"
			$("#userList_content").append(html)
		}
	}
	message_group.user_info = function(data) {
		$("#user_status").val(data.user_info.chess_status)
		if (data.user_info.chess_status == 1) {
			// $("#mesg_box")
			// $("#hint_title").html("等待对方响应...");
			// $("#hintBox").show()

			$("#mesg_title").html('等待对方响应..');
			$("#mesg_box").show()
		}
		if (data.user_info.chess_status == 3) {
			$("#select_title").html("<span style='color:blue'>" + data.user_info.s_inv_player + '</span>  邀请你进行对局');
			$("#selectBox").show()
		}
	}

	message_group.cancel_chess = function(data) {
			$("#hintBox").hide()
			$("#selectBox").hide()
			$("#mesg_box").hide()
		}
		//断开重连的时候发送这些消息
	message_group.chess_info = function(data) {
		//这里保存对手信息
		//棋局顺序
		//最后下子棋子颜色
		//棋局名称
		var chess_name = data.chess_info.chess_name;
		var last_play_color = data.chess_info.last_play_color;
		var chess = data.chess_info.chess;
		var currentUser = data.currentUser;
		var blackUser = data.chess_info.sName;
		var whiteUser = data.chess_info.rName;
		// console.log(data.chess_name)
		if (currentUser == blackUser) {
			var chess_color = 'black'
			$("#chess_color").val(chess_color)
		} else {
			var chess_color = 'white'

			$("#chess_color").val(chess_color)
		}

		if (last_play_color == 'white') {
			$("#whiteBox").find('.current_class').hide()
			$("#blackBox").find('.current_class').show()
		} else {
			$("#whiteBox").find('.current_class').show()
			$("#blackBox").find('.current_class').hide()
		}

		$("#chess_name").val(chess_name)
		$("#blackUser").html(blackUser)
		$("#whiteUser").html(whiteUser)
		$("#last_play_color").val(last_play_color)
		$("#currentUser").html(currentUser);

		for (var i = 0; i < 15; i++) {
			for (var j = 0; j < 15; j++) {
				if (chess[0][i][j] == 1) {
					draw_chess(i + 1, j + 1, 'black')
				}
				if (chess[1][i][j] == 1) {
					draw_chess(i + 1, j + 1, 'white')
				}
			}
		}
	}
	message_group.create_chess = function(data) {
		$("#selectBox").hide();
		$("#hintBox").hide()
		$("#mesg_box").hide()

		$("#hint_title").html('对局开始..');
		$("#hintBox").show();
		clear_board()
		setTimeout(function() {
			$("#hintBox").hide()
		}, 1000);
		var userName = $("#currentUser").html();
		if (userName == data.sName) {
			$("#chess_color").val('black')
		} else {
			$("#chess_color").val('white')
		}
		$("#chess_name").val(data.chess_name)
		$("#blackUser").html(data.sName)
		$("#last_play_color").val('white')
		$("#whiteUser").html(data.rName)
	}
	message_group.s_invitation = function(data) {
		$("#selectBox_flag").val(0)
		$("#user_status").val(3)
		$("#select_title").html("<span style='color:blue'>" + data.sName + '</span>  邀请你进行对局');
		$("#selectBox").show()
	}
	message_group.play_chess = function(data) {
		var x_line = data.x_line;
		var y_line = data.y_line;
		var chess_color = data.chess_color;
		if (chess_color == 'white') {
			$("#whiteBox").find('.current_class').hide()
			$("#blackBox").find('.current_class').show()
		}else{
			$("#whiteBox").find('.current_class').show()
			$("#blackBox").find('.current_class').hide()
		}
		$("#last_play_color").val(chess_color)
		draw_chess(x_line, y_line, chess_color)
	}
	message_group.isWin = function(data) {
		var winUser = data.winUser;
		$("#selectBox_flag").val(1)
		$("#chess_name").val(-1)
		$("#last_play_color").val('white')
		$("#chess_color").val('white')
		$("#select_title").html("<span style='color:blue'>" + winUser + '</span>  获得胜利！');
		$("#selectBox").show()
		$("#blackUser").html('&nbsp;');
		$("#whiteUser").html('&nbsp;');
		$("#whiteBox").find('.current_class').hide()
		$("#blackBox").find('.current_class').hide()
	}

	message_group.isLost = function(data) {
		var lostUser = data.lostUser;
		$("#selectBox_flag").val(1)
		$("#chess_name").val(-1)
		$("#last_play_color").val('white')
		$("#chess_color").val('white')
		var currentUser = $("#currentUser").html();
		if (currentUser == lostUser) {
			$("#select_title").html("<span style='color:blue'>" + '你' + '</span>  投降了');
		} else {
			$("#select_title").html("<span style='color:blue'>" + lostUser + '</span>  投降了');
		}
		$("#selectBox").show()
		$("#blackUser").html('&nbsp;');
		$("#whiteUser").html('&nbsp;');
		$("#whiteBox").find('.current_class').hide()
		$("#blackBox").find('.current_class').hide()
	}
	var sendData = function() {}
	var socket = new WebSocket('ws://127.0.0.1:4180');
	if ('WebSocket' in window) {
		function connect() {
			console.log('执行connect')
			socket.onopen = function(event) {
				$("#hint_title").html('连接服务器成功！')
				$("#hintBox").hide();
				sendData = function(data) {
					socket.send(data)
				}
				socket.onmessage = function(event) {
					var data = JSON.parse(event.data)
					message_group[data.flag](data)
				}
				socket.onclose = function(event) {
					console.log('连接被关闭')
					connect()
				};
				socket.onerr = function(err) {
					console.log(err)
				}
				var cookie = cookieParser(document.cookie)
				var userName = cookie.userName;
				sendData(JSON.stringify({
					flag: 'login',
					userName: userName
				}))
			}
		}
		connect()
	} else {
		alert('本浏览器不支持WebSocket');
	}
	$(document).on('click', '#send_lost', function() {
		var lost_name = $("#currentUser").html();
		var chess_name = $("#chess_name").val()
		var data = {
			flag: 'send_lost',
			lost_name: lost_name,
			chess_name: chess_name
		}
		console.log(data)
		sendData(JSON.stringify(data))
	})
	$(document).on('click', '.ue_userName', function() {
		var user_status = $("#user_status").val()
		if (user_status != 0) {
			return
		}
		var sName = $("#currentUser").html()
		var rName = $(this).html()
		if (sName == rName) {
			//不能和自己对局
			return;
		}
		var data = {
			flag: 'send_invitation',
			sName: sName,
			rName: rName
		}
		sendData(JSON.stringify(data))
			// $("#hint_title").html("等待对方响应...");
			// $("#hintBox").show()
		$("#mesg_title").html('等待对方响应..');
		$("#mesg_box").show()
	})
	$(document).on('click', '#mesg_close', function() {
		var currentUser = $("#currentUser").html()
		var data = {
			flag: 'cancel_inv',
			userName: currentUser
		}
		sendData(JSON.stringify(data))
	})
	$(document).on('click', '#select_ensure', function() {
		if ($("#selectBox_flag").val() == 1) {
			$("#selectBox").hide();
			$("#hintBox").hide()
			$("#user_status").val(0)
			$("#selectBox_flag").val(0)
			clear_board();
			clear_board()
			return;
		}
		$("#user_status").val(1)
		var sName = $("#select_title span").html()
		var rName = $("#currentUser").html()
		var data = {
			flag: 'create_chess',
			sName: sName,
			rName: rName
		}
		sendData(JSON.stringify(data))
	})

	$(document).on('click', '#select_close', function() {
		if ($("#select_close").val() == 1) {
			$("#selectBox").hide()
		}
		$("#user_status").val(0)
		var currentUser = $("#currentUser").html()
		var data = {
			flag: 'cancel_chess',
			userName: currentUser
		}
		sendData(JSON.stringify(data))
	})

	function setCurrentUser() {
		var cookie = cookieParser(document.cookie);
		var userName = cookie.userName;
		$("#currentUser").html(userName)
	}

	function cookieParser(str) {
		var cookieStr = str
		var cookieArr = (cookieStr || '').split('; ');
		var cookieJson = {}
		for (var i in cookieArr) {
			cookieArr[i] = cookieArr[i].split('=')
			cookieJson[cookieArr[i][0]] = cookieArr[i][1]
		}
		return cookieJson;
	}

	function click_event_handle(e) {
		var x = e.pageX;
		var y = e.pageY;
		x -= c.offsetLeft;
		y -= c.offsetTop;
		var x_line = parseInt(Number(x / 30).toFixed())
		var y_line = parseInt(Number(y / 30).toFixed())
		if (x_line > 15 || x_line < 1 || y_line > 15 || y_line < 1) {
			return
		}
		var chess_name = $("#chess_name").val()
		var chess_color = $("#chess_color").val()
		var last_play_color = $("#last_play_color").val();
		var play_user = $("#currentUser").html();
		if (chess_color == last_play_color) {
			return;
		}

		if (last_play_color == 'white') {
			$("#whiteBox").find('.current_class').show()
			$("#blackBox").find('.current_class').hide()
		} else {
			$("#whiteBox").find('.current_class').hide()
			$("#blackBox").find('.current_class').show()
		}

		var data = {
			flag: 'play_chess',
			x_line: x_line,
			y_line: y_line,
			chess_color: chess_color,
			chess_name: chess_name,
			play_user: play_user
		}
		sendData(JSON.stringify(data))
	}

	function draw_chess(x_line, y_line, color) {
		// return
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x_line * 30, y_line * 30, 10, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

	}

	function clear_board() {
		ctx.clearRect(0, 0, c.width, c.height);
		draw_board()
	}

	function draw_board() {
		// return
		for (var i = 1; i < 16; i++) {
			ctx.moveTo(i * 30, 30);
			ctx.lineTo(i * 30, 450);
		}
		for (var i = 1; i < 16; i++) {
			ctx.moveTo(30, i * 30);
			ctx.lineTo(450, i * 30);
		}
		ctx.stroke();

		//绘制地图上的5个点
		ctx.fillStyle = 'black'
		ctx.beginPath();
		ctx.arc(30 * 4, 30 * 4, 4, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = 'black'
		ctx.beginPath();
		ctx.arc(30 * 12, 30 * 4, 4, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = 'black'
		ctx.beginPath();
		ctx.arc(30 * 4, 30 * 12, 4, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = 'black'
		ctx.beginPath();
		ctx.arc(30 * 12, 30 * 12, 4, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = 'black'
		ctx.beginPath();
		ctx.arc(30 * 8, 30 * 8, 4, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
})