function ajaxPost(route, args, callback) {
	$.ajax({
		url: route,
		type: "post",
		dataType: "json",
		data: args,
		success: callback
	})
}