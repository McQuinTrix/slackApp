var http = require("http");
var random = require("random-js")();
var url = require("url");
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var btoa = require('btoa')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//port for Heroku
app.set('port', (process.env.PORT || 5000));
app.get('/',function(req,res){
	res.send('Running');
});
/*app.get('/liveh2h',function(req,res){
    var str = "";
    Object.keys(req).forEach(function(elem){
        str += elem + ": " + req[elem]+"\n";
    })
    res.send(str);
})*/

app.post('/hipchat',function(req,res){
    var json = {
        "color": "green",
        "message": JSON.stringify(req),
        "notify": false,
        "message_format": "text"
    }
    request({
        url: "https://devliveh2h.hipchat.com/v2/room/3119009/notification?auth_token=FLRZkAPekTGr89ZjP61lYm1kJnzOUf8TpdyVIBYX",
        method: "POST",
        json: json
    },function(err,resp,body){
        if(error){
            console.log(error);
        }else{
            console.log(resp.statusCode, body);
        }
    })
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
                "meeting_id": ""+meetingID,
                "user_display_name": req.body.user_name.replace(/_/g, " ")
            };
            requestJSON.host = "yes";
            var base64JSON = btoa(encodeURIComponent(JSON.stringify(requestJSON)));
            var hLink = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
            var url = "https://slack.com/api/chat.postMessage?";
                url += "token=xoxp-72362934594-72362934674-74712859188-7e4bab5339",
                url += "&icon_url="+encodeURIComponent("https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png");
                url += "&username=LiveH2H";
            var HostURL = url + "&channel=%40"+req.body.user_name;
                HostURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! Your meeting has been created: <'+hLink+'|Click here to join>"}]');
            var PartURL = "";
            //Host Messge
            request.post(HostURL);
            
            //Participants
            requestJSON.host = "no";
            arr.forEach(function(elem,num){
                if(num > 1){
                    if(elem[0] === "@"){
                        requestJSON.user_display_name = elem.substring(1);
                        console.log(requestJSON);
                        base64JSON = btoa(encodeURIComponent(JSON.stringify(requestJSON)));
                        var pLink = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
                        PartURL += url+"&channel=%40"+requestJSON.user_display_name
                        PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you have been invited: <'+pLink+'|Click here to join>"}]')
                    }else if(elem[0] === "#"){
                        var theID = requestJSON.meeting_id.subtring(0,3) + "-" + requestJSON.meeting_id.subtring(3,6)+ "-" + requestJSON.meeting_id.subtring(6);
                        var gLink = "https://meet1.liveh2h.com/index.html?roomname="+theID;
                        PartURL += url + "&channel="+elem.substring(1);
                        PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you all have been invited: <'+gLink+'|Click here to join>"}]')
                    }
                    request.post(PartURL);
                }
            })
        }
		/*
		request.post(
            req.body.response_url,{json:{
			"response_type": 'in_channel',
			"text": "Ooo..So you <@"+req.body.user_id+"|"+req.body.user_name+"> wanna create "+arr[1]+"! Lets do it with: <"+arr[2]+">"
		}},function(err,resp,body){
			
		})*/
        /*
		request.post("https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&channel=general&text=hey&username=mcquintrix&pretty=1");*/
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
    