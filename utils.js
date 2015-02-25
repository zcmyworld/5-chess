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

// console.log(chess[0][14][15])
// return

var utils = module.exports;

utils.cookieParser = function(str) {
	var cookieStr = str
	var cookieArr = (cookieStr || '').split('; ');
	var cookieJson = {}
	for (var i in cookieArr) {
		cookieArr[i] = cookieArr[i].split('=')
		cookieJson[cookieArr[i][0]] = cookieArr[i][1]
	}
	return cookieJson;
}