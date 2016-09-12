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
app.get('/liveh2h',function(req,res){
    res.send("Hello");
    res.send("req");
})
app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" ");
	if(arr[0] === "create"){
		//res.sendStatus(200);
		res.setHeader('Content-Type', 'application/json')
		res.send("Creating..");
		request.post(
            req.body.response_url,{json:{
			"response_type": 'in_channel',
			"text": "Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it with: <"+arr[2]+">"
		}},function(err,resp,body){
			
		})
		request.post("https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&channel=general&text=hey&username=mcquintrix&pretty=1");
		//res.send("Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it!"+req.body.text);
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});
//https://slack.com/oauth/reflow?client_id=72362934594.72343901492&scope=team%3Aread+chat%3Awrite%3Abot
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});