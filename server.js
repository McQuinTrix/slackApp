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
app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" ");
	if(arr[0] === "create"){
		res.send("Ooo..So you "+req.body.user_name+" wanna create "+req[1]+"! Lets do it!");
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});