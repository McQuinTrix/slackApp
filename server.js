var http = require("http");
var url = require("url");
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var request = require('request');
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
		//res.sendStatus(200);
		res.setHeader('Content-Type', 'application/json')
		res.send(JSON.stringify({
			"response_type": 'in_channel',
			"text": "Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it with: <"+arr[2]+">"
		}));
		request.post(req.body.response_url,{json:{
			"response_type": 'in_channel',
			"text": "Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it with: <"+arr[2]+">"
		}},function(err,resp,body){
			
		})
		//res.send("Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it!"+req.body.text);
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});