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

/*app.get('/liveh2h',function(req,res){
    var str = "";
    Object.keys(req).forEach(function(elem){
        str += elem + ": " + req[elem]+"\n";
    })
    res.send(str);
})*/

app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" ");
	if(arr[0] === "create"){
        if(arr[1] === "webinar"){
            //res.setHeader('Content-Type', 'application/json')
            res.send("Webinar not yet supported.");
        }else if(arr[1] === "meeting"){
            //res.send("Creating a meeting and inviting others..");
            var meetingID = random.integer(100000000, 999999999);
            res.send(meetingID);
            var requestJSON = {
                "origin": "H2H",
                "meeting_id": meetingID,
                "user_display_name": req.body.user_name.replace(/_/g, " ")
            };
            res.send(requestJSON);
            requestJSON.host = "yes";
            var base64JSON = window.btoa(encodeURIComponent(JSON.stringify(requestJSON)));
            var hLink = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
            var url = "https://slack.com/api/chat.postMessage?";
                url += "token=xoxp-72362934594-72362934674-74712859188-7e4bab5339",
                url += "&icon_url=https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png"
                url += "&username=LiveH2H";
            
            var HostURL = url + "&channel=%40"+req.body.user_name;
                HostURL += "&text=Your meeting has been created: <"+hLink+"|Click here to join>";
            res.send(HostURL);
            var PartURL = "";
            //Host Messge
            request.post(encodeURIComponent(HostURL));
            //Participants
            requestJSON.host = "no";
            arr.forEach(function(elem,num){
                if(num > 1){
                    if(elem[0] === "@"){
                        requestJSON.user_display_name = elem.substring(1);
                        base64JSON = window.btoa(encodeURIComponent(JSON.stringify(requestJSON)));
                        var pLink = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
                        PartURL += "&channel=%40"+requestJSON.user_display_name
                        PartURL += "&text=Hello! "+req.body.user_name+" has created a meeting, and you have been invited: <"+pLink+"|Click here to join>"
                    }else if(elem[0] === "#"){
                        var glink = "https://meet1.liveh2h.com/index.html?roomname="+requestJSON.meeting_id;
                        PartURL += "&channel="+elem
                        PartURL += "&text=Hello! "+req.body.user_name+" has created a meeting, and you all have been invited: <"+gLink+"|Click here to join>"
                    }
                    request.post(encodeURIComponent(PartURL));
                }
            })
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
		request.post("https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&channel=general&text=hey&username=mcquintrix&pretty=1");*/
	}else{
		res.send("I am sorry I didn't quite catch that!");
	}
	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
    