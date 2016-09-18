var http = require("http");
var random = require("random-js")();
var url = require("url");
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var btoa = require('btoa');
var atob = require('atob');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/*
create schema slack;
create table slack.tokens(
TEAM_ID VARCHAR(100) PRIMARY KEY NOT NULL,
ACCESS_TOKEN VARCHAR(100) NOT NULL,
TEAM_NAME VARCHAR(100),
BOT_USER_ID VARCHAR(100) NOT NULL,
BOT_ACCESS_TOKEN VARCHAR(100) NOT NULL);
*/

var pg = require('pg');

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');
});

//port for Heroku
app.set('port', (process.env.PORT || 5000));
app.get('/',function(req,res){
	res.send('Running');
});

//Authorize
app.get('/authorize',function(req,res){
    var str = "";
    var code = req.query.code;
    //AUTHORIZATION CODE VERIFICATION
    request.post("https://slack.com/api/oauth.access?client_id=72362934594.72343901492&client_secret=774325bbe3f942efb71d5db978eb5a4b&code="+code,function(err,resp,body){
        
        var json = JSON.parse(body);
        var access_token = json.access_token,
            user_id = json.user_id,
            team_name = json.team_name,
            team_id = json.team_id,
            bot_user_id = json.bot.bot_user_id,
            bot_access_token = json.bot.bot_access_token;
        //QUERIES----
        var theSelect = "SELECT * FROM slack.tokens WHERE team_id ='"+team_id+"'",
            theDelete = "DELETE FROM slack.tokens WHERE team_id ='"+team_id+"'",
            theString = "INSERT INTO slack.tokens (team_id,access_token,team_name,bot_user_id,bot_access_token) VALUES ('";
        theString += team_id +"', '"+access_token+"', '"+team_name+"', '"+bot_user_id+"', '"+bot_access_token+"');"
        //-----------
        //EXECUTING QUERIES---
            //CONNECTING TO DB----
        pg.connect(process.env.DATABASE_URL, function(err,client,done){
            client.query(theSelect, function(err,result){
                //DELETE THE OLD VERSION IF FOUND---
                if(err) throw err;
                if(result.rowCount > 0){
                    client.query(theDelete, function(err,result){
                        if(err){console.error(err);}
                        else{
                            //INSERTING TO TABLE slack.tokens
                            client.query(theString, function(err,result){
                                done();
                                if(err){console.error(err);}
                            })
                            //-------------------
                        }
                    })
                    
                }else{
                    //INSERTING TO TABLE slack.tokens
                    client.query(theString, function(err,result){
                        done();
                        if(err){console.error(err);}
                    })
                    //-------------------
                }
                //----------------------------------
                
            })
        });
        //--------------------
    })
})

//Slash Command
app.post('/liveh2h',function(req,res){
	var arr = req.body.text.split(" "),
        thisChannel = req.body.channel_id;
        if(arr[0] === "webinar"){
            //res.setHeader('Content-Type', 'application/json')
            res.send("Webinar not yet supported.");
        }else if(arr[0] === "meetnow" || arr[0][0]==="@" || arr[0][0]==="#"){
            res.send("Creating a meeting and inviting others..");
            
            var apiUrl = "https://app.liveh2h.com/tutormeetweb/rest/v1/meetings/instant",
                name = req.body.user_name.replace(/_/g, " "),
                email = "",
                //email = document.getElementById("meetform1").elements["emailfield"].value;
                obj = {name:name, email:email},
                meetingurl = "";
            //CALL TO API
            request({
                uri: apiUrl,
                method: 'POST',
                json: obj
            },function(err,response,body){
                if(err){throw err;}
                console.log(response.body);
                meetingurl = response.body.data.meetingURL;
                var urlDecoded = JSON.parse(decodeURIComponent(atob(response.body.data.meetingUri))),
                    meetingID = urlDecoded.meeting_id;
                
                var hLink = response.body.data.meetingURL;
            
                var urlSlack = "https://slack.com/api/chat.postMessage?";
                    urlSlack += "token=xoxp-72362934594-72362934674-74712859188-7e4bab5339",
                    urlSlack += "&icon_url="+encodeURIComponent("https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png");
                    urlSlack += "&username=LiveH2H";
                
                var HostURL = urlSlack + "&channel=%40"+req.body.user_name;
                    HostURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! Your meeting has been created: <'+hLink+'|Click here to join>"}]');
                //Host Messge
                request.post(HostURL);

                //Participants
                var PartURL = "";
                arr.forEach(function(elem,num){
                    if(num > 0){
                        if(elem[0] === "@"){
                            var pLink = "";
                            var partstr ={"name": elem.substring(1),"meetingId":meetingID};
                            request({
                                uri: apiUrl,
                                method: 'POST',
                                json: partstr
                            }, function(err,resp){
                                PartURL += urlSlack+"&channel=%40"+elem.substring(1)
                                PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you have been invited: <'+pLink+'|Click here to join>"}]');
                                request.post(PartURL);
                            })
                            
                        }else if(elem[0] === "#"){
                            var theID = meetingID.substring(0,3) + "-" + meetingID.substring(3,6)+ "-" + meetingID.substring(6);
                            var gLink = response.body.data.serverURL+"/index.html?roomname="+theID;
                            PartURL += urlSlack + "&channel="+elem.substring(1);
                            PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! '+req.body.user_name+' has created a meeting, and you all have been invited: <'+gLink+'|Click here to join>"}]')
                            request.post(PartURL);
                        }
                        
                    }
                })
            })
            
            //https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&icon_url=https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png&username=LiveH2H&channel=''
            
        }else if(arr[0] === "help"){
            res.send("Help Command");
        }else{
            res.send("I am sorry I didn't quite catch that!");
        }
	
});

//Listening Command
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
    
//Hipchat Command
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
        }
    })
})