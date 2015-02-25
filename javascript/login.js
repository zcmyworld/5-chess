$(document).ready(function() {
	$("#ensure").click(function(){
		var userName = $("#userName").val();
		if(userName.length == 0){
			alert('输入不能为空')
			return;
		}
		var route = "/login1";
		var args = {
			userName:userName
		}
		ajaxPost(route,args,function(data){
			if(data.error){
				alert('系统错误：'+data.error)
				return;
			}
			window.location.href='/5chess'
		})
	})
})