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

var pg = require('pg');

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client.query('SELECT * FROM slack.tokens;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});

//port for Heroku
app.set('port', (process.env.PORT || 5000));
app.get('/',function(req,res){
	res.send('Running');
});
app.get('/authorize',function(req,res){
    var str = "";
    var code = req.query.code;
    console.log(req.query.code);
    request.post("https://slack.com/api/oauth.access?client_id=72362934594.72343901492&client_secret=774325bbe3f942efb71d5db978eb5a4b&code="+code,function(err,resp,body){
        console.log(body);
    })
})

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
        if(err){
            console.log(err);
        }else{
            console.log(resp.statusCode, body);
            var json = JSON.stringify(body),
                access_token = json.access_token,
                user_id = json.user_id,
                team_name = json.team_name,
                team_id = json.team_id,
                bot_user_id = json.bot.bot_user_id,
                bot_access_token = json.bot.bot_access_token
            console.log(team_id,access_token,team_name,bot_user_id,bot_access_token);
        }
    })
})

app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" "),
        thisChannel = req.body.channel_id;
        if(arr[0] === "webinar"){
            //res.setHeader('Content-Type', 'application/json')
            res.send("Webinar not yet supported.");
        }else if(arr[0] === "meetnow"){
            res.send("Creating a meeting and inviting others..");
            var meetingID = random.integer(100000000, 999999999);
            var requestJSON = {
                "origin": "H2H",
                "meeting_id": ""+meetingID,
                "user_display_name": req.body.user_name.replace(/_/g, " ")
            };
            //https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&icon_url=https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png&username=LiveH2H&channel=''
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
                if(num > 0){
                    if(elem[0] === "@"){
                        requestJSON.user_display_name = elem.substring(1);
                        base64JSON = btoa(encodeURIComponent(JSON.stringify(requestJSON)));
                        var pLink = "https://meet1.liveh2h.com/launcher.html?p=" + base64JSON + "&b=true";
                        PartURL += url+"&channel=%40"+requestJSON.user_display_name
                        PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you have been invited: <'+pLink+'|Click here to join>"}]')
                    }else if(elem[0] === "#"){
                        var theID = requestJSON.meeting_id.substring(0,3) + "-" + requestJSON.meeting_id.substring(3,6)+ "-" + requestJSON.meeting_id.substring(6);
                        var gLink = "https://meet1.liveh2h.com/index.html?roomname="+theID;
                        PartURL += url + "&channel="+elem.substring(1);
                        PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you all have been invited: <'+gLink+'|Click here to join>"}]')
                    }
                    request.post(PartURL);
                }
            })
        }else if(arr[0] === "help"){
            res.send("Help Command");
        }else{
            res.send("I am sorry I didn't quite catch that!");
        }
	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
    