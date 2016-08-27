var http = require("http");
var qs = require("querystring");
console.log("Bavo");
http.createServer(function (request,response){
	if(request.method === "POST"){
		request.on('data',function(data){
			console.log(data);
			response.writeHead(200, {'Content-Type': 'text/html'});
        		response.write('<!doctype html><html><head><title>Cool</title></head><body>'+Date.now()+'</body>')
		})
	}
}).listen(8000);