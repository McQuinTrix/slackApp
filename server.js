var http = require("http");
var url = require("url");
var express = require("express");
var app = express();
app.use(express.json());

//port for Heroku
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.post('/liveh2h',function(req,res){
	var url = url.parse(req.url,true);
	
	res.send("Got Message");
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});