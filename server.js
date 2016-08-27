var http = require("http");
var url = require("url");
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//port for Heroku
app.set('port', (process.env.PORT || 5000));
app.get('/',function(req,res){
	res.send('Running');
});
app.get('/liveh2h',function(req,res){
	var query = req.body.text;
	res.send("Got Message"+(req.text? req.text : ""));
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});