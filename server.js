var http = require("http");
var random = require("random-js")();
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
    var str = "";
    Object.keys(req).forEach(function(elem){
        str += elem + ": " + req[elem]+"\n";
    })
    res.send(str);
})

app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" ");
	if(arr[0] === "create"){
        if(arr[1] === "webinar"){
            //res.setHeader('Content-Type', 'application/json')
            res.send("Webinar not yet supported.");
        }else if(arr[1] === "meeting"){
            res.send("Creating a meeting and inviting others..");
            var meetingID = random.integer(100000000, 999999999);
            
            var requestJSON = {
                "origin": "H2H",
                "meeting_id": meetingID,
                "user_display_name": name.replace(/_/g, " ")
            };
            var stringifiedJSON = JSON.stringify(requestJSON);
            var encodedJSON = encodeURIComponent(stringifiedJSON);
            var base64JSON = window.btoa(encodedJSON);
            requestJSON.host = "yes";
            window.location = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
            request({
                method: "POST",
                uri: "https://slack.com/api/chat.postMessage",
                multipart:[{
                    'content-type': 'application/json',
                    'body': JSON.stringify({
                        "ok": "true",
                        "token": "xoxp-72362934594-72362934674-74712859188-7e4bab5339",
                        "channel": "@"+req.body.user_name,
                        "text": "'hello'",
                        "username": "LiveH2H",
                        "icon_url": "https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png"
                    })
                }]
            });
            /*
            request.post("https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&channel=%40"+req.body.user_name+"&text=%22hello%22&username=LiveH2H&icon_url=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fslack-files2%2Favatars%2F2016-08-30%2F74712263348_338d6d654f54bdcb4685_48.png&pretty=1");
            */
        }
		//res.sendStatus(200);
		/*
		request.post(
            req.body.response_url,{json:{
			"response_type": 'in_channel',
			"text": "Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it with: <"+arr[2]+">"
		}},function(err,resp,body){
			
		})*/
        /*
		request.post("https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&channel=general&text=hey&username=mcquintrix&pretty=1");
        */
		//res.send("Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it!"+req.body.text);
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});
//https://slack.com/oauth/reflow?client_id=72362934594.72343901492&scope=team%3Aread+chat%3Awrite%3Abot
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});