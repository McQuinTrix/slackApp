var http = require("http");
var url = require("url");
var express = require("express");
var app = express();
app.use(express.json());

//port for Heroku
app.set('port', (process.env.PORT || 5000));

app.post('/liveh2h',function(req,res){
	var url = url.parse(req.url,true);
	
	res.send("Got Message");
});