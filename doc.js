online_user//在线人数
{
	userName//用户名
	chess_status//用户状态 0空闲 1发送邀请 2对局中 3接收邀请
	chess_name//对局名称
	isSend//是否为对局发起者
	other_player//对手名称

	// s_inv_player//发送邀请的对手名称
	// r_inv_player//接收邀请的对手名称
}

open_chess//进行中的对局
{
	chess_name//对局名称
	sName//对局发起者名称
	rName//对局接收者名称
	t//对局开始时间
	chess//3维数组保存整个对局
	last_play_color//最后下子的颜色
}

ws_group//保存的链接
{
	userName:ws
}

ws.chess_userName = userName

//前端
chess_name//棋局名称
chess_color//当前用户所拥有的棋子颜色
last_play_color//最后下子的棋子颜色
user_status//用户状态

//通用消息框
1-只显示不进行任何操作
2-只可取消
mesgBOx
mesg_flag-1:取消对局
mesg_flag-2:单纯隐藏
3-可确定可取消