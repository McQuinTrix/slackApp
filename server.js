var http = require("http");
var qs = require("querystring");
var port = process.env.PORT || 3000;
var express = require("express");
var app = express();
app.use(express.json());

//port for Heroku
app.set('port', (process.env.PORT));

app.post('/liveh2h',function(req,res){
	/*if(req.token === "bPQAKQ0fj4WHw37l8kIhwYZY"){
		
	}*/
	res.send("Got Message");
});