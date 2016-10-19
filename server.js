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
var mysql = require('mysql');
 var path = require('path');
var winston = require("winston");
winston.add(winston.transports.File, { filename: './logs.log' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));

/***************************/
/*** SERVER CERTIFICATES ***/
/***************************/
var server;
//TURN OFF FOR MEETDEV1
var heroku = false;
var fs      = require('fs');
var path    = require('path');
var port    = process.env.PORT || 8091;
var protocol = "https";
var directory  = module.filename.substr(0, module.filename.lastIndexOf("/")); 

app.use(function(req, res, next) {  // CORS on ExpressJS (http://enable-cors.org/server_expressjs.html)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
try{
    if (protocol == "http" || heroku) {
      server = require('http').Server(app);
    } else {
        var hskey  = fs.readFileSync('/opt/web/mybase/testcerts2/liveh2h_com.key');
        var hscert = fs.readFileSync('/opt/web/mybase/testcerts2/liveh2h_com.crt');
        var cacert = fs.readFileSync('/opt/web/mybase/testcerts2/CA.crt');
        var options = {
          rejectUnauthorized: false,
          key:  hskey,
          cert: hscert,
          ca: cacert,
          passphrase: 'tgh2hk'
        };  

        server = require('https').Server(options, app);  
    }
}catch(e){
    throw e;
}

//server = require('http').Server(app);
server.listen(port);
/***************************/

//Getting the db configurations
var dbconfig = require("./dbconfig.json");
var connection = mysql.createConnection({
  host     : dbconfig.host,
  user     : dbconfig.user,
  password : dbconfig.password,
  database : dbconfig.database
});
connection.connect();

//For Showing that script is running
app.get('/',function(req,res){
	res.render('index.html');
});

var dbObj = {};
dbObj.getSelect = function(teamID){
    return "SELECT * FROM h2h_plugins_slack WHERE slack_team_id ='"+teamID+"'";
}

//Authorize
app.get('/authorize',function(req,res){
    var str = "";
    var code = req.query.code;
    var client_id = "19710695585.81036963991";
    var client_secret = "640cd7625195f277c2f8dab08713419e";
    if(heroku){
        client_id = "72362934594.72343901492";
        client_secret = "774325bbe3f942efb71d5db978eb5a4b";
    }
    //AUTHORIZATION CODE VERIFICATION
    request.post("https://slack.com/api/oauth.access?client_id="+client_id+"&client_secret="+client_secret+"&code="+code,function(err,resp,body){
        if(err){throw err;};
        var json = JSON.parse(body);
        var access_token = json.access_token,
            user_id = json.user_id,
            team_name = encodeURIComponent(json.team_name).replace(/\'/g," "),
            team_id = json.team_id,
            bot_user_id = json.bot.bot_user_id,
            bot_access_token = json.bot.bot_access_token;
        //QUERIES----
        var theSelect = dbObj.getSelect(team_id),
            theDelete = "DELETE FROM h2h_plugins_slack WHERE slack_team_id ='"+team_id+"'",
            theInsert = "INSERT INTO h2h_plugins_slack (`slack_team_id`,`slack_token`,`slack_team_name`,`slack_bot_user_id`,`slack_bot_token`) VALUES ('";
        theInsert += team_id+"', '"+access_token+"', '"+team_name+"', '"+bot_user_id+"', '"+bot_access_token+"');";
        var theUpdate = "UPDATE h2h_plugins_slack SET slack_token='"+access_token+"'"
                        + ", slack_team_name='"+team_name+"'"
                        + ", slack_bot_user_id='"+bot_user_id+"'"
                        + ", slack_bot_token='"+bot_access_token+"'"
                        + " WHERE slack_team_id = '"+team_id+"'";
        
        try{
            connection.query( theSelect, function(err,rows,field){
                if (err) {winston.error(err.message);throw err;}
                if(rows.length === 0){
                    connection.query( theInsert, function(err,rows,field){
                        if(err) throw err;
                        res.redirect('/');
                    })
                }else{
                    connection.query( theUpdate, function(err,rows,field){
                        if(err) {winston.error(err.message);throw err;}
                        res.redirect('/');
                    })   
                }
            })
        }catch(e){
            throw e;
        }
        //-----------
        //EXECUTING QUERIES---
            //CONNECTING TO DB----
        
        /*
        pg.connect(process.env.DATABASE_URL, function(err,client,done){
            client.query(theSelect, function(err,result){
                //DELETE THE OLD VERSION IF FOUND---
                if(err) throw err;
                if(result.rowCount > 0){
                    client.query(theDelete, function(err,result){
                        if(err){winston.error(err);}
                        else{
                            //INSERTING TO TABLE slack.tokens
                            client.query(theString, function(err,result){
                                done();
                                if(err){winston.error(err);}
                            })
                            //-------------------
                        }
                    })
                    
                }else{
                    //INSERTING TO TABLE slack.tokens
                    client.query(theString, function(err,result){
                        done();
                        if(err){winston.error(err);}
                    })
                    //-------------------
                }
                //----------------------------------
                
            })
        });
        */
        //--------------------
    })
})
var tutorToken = "token=xoxp-19710695585-28627574003-81044075074-a173d8a614";
var devTeamToken = "token=xoxp-72362934594-72362934674-81902220208-300d165db9a027b9b7cb810ebad5d7ea";
var tokenUsed = devTeamToken;

//Slash Command
app.post('/liveh2h',function(req,res){
    var timeStamp = Math.floor((new Date).getTime()/1000);
	var arr = req.body.text.split(" "),
        thisChannel = req.body.channel_id,
        thisTeam = req.body.team_id,
        urlSlack = "https://slack.com/api/chat.postMessage?";
        connection.query(dbObj.getSelect(thisTeam),function(err,rows,field){
            if(err){throw err;}
            tokenUsed = "token="+rows[0].slack_token;
            var teamName = rows[0].slack_team_name;
            urlSlack += tokenUsed,
            urlSlack += "&icon_url="+encodeURIComponent("https://s3-us-west-2.amazonaws.com/slack-files2/avatar-temp/2016-09-18/80976650579_59e903b677a8359139ab.png");
            urlSlack += "&username=LiveH2H";
            
            winston.info(tokenUsed);
            if(arr[0] === "webinar"){
                //res.setHeader('Content-Type', 'application/json')
                res.send("Webinar not yet supported.");

            }else if(arr[0] === "meetnow" || arr[0][0]==="@" || arr[0][0]==="#" || arr[0].length === 0 ){
                var str =""
                if(arr[0].length !== 0 && typeof arr[1] !== undefined){
                        str =" and inviting others";
                }
                res.send("Creating a meeting"+str+"!");
                //POST Request to get USER LIST
                request({
                    uri: "https://slack.com/api/users.list?token="+tokenUsed,
                    method: "POST"
                },function(errUList,responseUList, bodyUList){
                    if(errUList){
                        throw errUList;
                    }

                    var apiUrl = "https://app.liveh2h.com/tutormeetweb/rest/v1/meetings/instant",
                    name = req.body.user_name.replace(/_/g, " "),
                    email = "",
                    obj = {name:name, email:email},
                    meetingurl = "";

                    winston.info(name);
                    //CALL TO API
                    request({
                        uri: apiUrl,
                        headers:{
                            referer: "Slack - "+teamName
                        },
                        method: 'POST',
                        json: obj
                    },function(err,response,body){
                        if(err){throw err;}
                        try{
                            connection.query("UPDATE h2h_plugins_slack SET slack_meeting_count = slack_meeting_count + 1 WHERE slack_team_id = '"+thisTeam+"'" ,
                                             function(err,rows,field){
                                                if(err) throw err;

                            })
                        }catch(e){
                            throw e;
                        }
                        var emailURL = response.body.data.serverURL;
                        meetingurl = response.body.data.meetingURL;
                        var urlDecoded = JSON.parse(decodeURIComponent(atob(response.body.data.meetingUri))),
                            meetingID = response.body.data.meetingId;
                        var hLink = response.body.data.meetingURL;
                        var theID = meetingID.substring(0,3) + "-" + meetingID.substring(3,6)+ "-" + meetingID.substring(6);
                        //https://slack.com/api/im.list?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339
                        var HostURL = urlSlack + "&channel=%40"+req.body.user_name;
                            HostURL += '&attachments=' + encodeURIComponent('[{"fallback": "Meeting invite from LiveH2H!","text":"Hello! Your meeting ('+theID+') has been created : <'+hLink+'|Click here to join>"}]');
                        //Host Messge
                        request.post(HostURL,function(err,resp){
                        });
                        request.post(req.body.response_url,{json:{
                            "response_type": "ephemeral",
                            "attachments": [{
                                "fallback": "Meeting invite from LiveH2H!",
                                "title" : "Meeting Invite:",
                                "mrkdwn_in":["text"],
                                "text": 'Hello! Your meeting ('+theID+') has been created : <'+hLink+'|Click here to join> \n\n For more features, visit: <https://www.liveh2h.com/|LiveH2H.com>',
                                "footer": "LiveH2H",
                                "footer_icon": "https://s3-us-west-2.amazonaws.com/slack-files2/avatar-temp/2016-09-18/80976650579_59e903b677a8359139ab.png",
                                "ts": timeStamp
                            }]
                            }},function(err,resp){
                                if(err){
                                     throw err;
                                    winston.error(err);
                                }
                                console.log(resp);
                            })
                        //Participants
                        var PartURL = "";
                        var sendObj =  {
                            "origin": "TMI",
                            "meeting_id": meetingID,
                            "email_addresses": []
                        };
                        var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                        arr.forEach(function(elem,num){

                            if((arr[0]==="meetnow" && num > 0) || (arr[0]!=="meetnow")){
                                if(elem[0] === "@"){
                                    var pLink = "";
                                    winston.info(meetingID);
                                    var partstr ={"name": elem.substring(1),"meetingId":meetingID};
                                    request({
                                        uri: "https://app.liveh2h.com/tutormeetweb/rest/v1/meetings/join",
                                        headers:{
                                            referer: "Slack - "+teamName
                                        },
                                        method: 'POST',
                                        json: partstr
                                    }, function(err,resp){
                                        if(err){throw err;}
                                        winston.info("Invitee: "+elem.substring(1));
                                        pLink = resp.body.data.meetingURL;
                                        PartURL = urlSlack+"&channel=%40"+elem.substring(1)
                                        PartURL += '&attachments=' + encodeURIComponent('[{"fallback": "Meeting invite from '+req.body.user_name+'","text":"Hello! '+req.body.user_name+' has created a meeting ('+theID+'), and you have been invited: <'+pLink+'|Click here to join>"}]');

                                        request.post(PartURL);
                                    })

                                }else if(elem[0] === "#"){
                                    //;
                                    var gLink = "https://liveh2h.com/"+meetingID;
                                    PartURL += urlSlack + "&channel="+elem.substring(1);
                                    PartURL += '&attachments=' + encodeURIComponent('[{"fallback": "Meeting invite from '+req.body.user_name+'","text":"Hello! '+req.body.user_name+' has created a meeting, and you have been invited: <'+gLink+'|Click here to join>"}]')
                                    request.post(PartURL);
                                }else if(emailRegex.test(elem)){
                                        sendObj.email_addresses = elem;
                                }
                            }
                        })
                        if(sendObj.email_addresses.length > 0){
                            try{
                                request({
                                    type: "POST",
                                    url: emailURL  + "/h2h_data/h2h_invitees",
                                    json: sendObj
                                },function(err,resp){
                                    if(err) winston.info(err);
                                });
                            }catch(e){
                                winston.error(e.message);
                                throw e;
                            }
                        }
                    })
                    })


                //https://slack.com/api/chat.postMessage?token=xoxp-72362934594-72362934674-74712859188-7e4bab5339&icon_url=https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2016-08-30/74712263348_338d6d654f54bdcb4685_48.png&username=LiveH2H&channel=''

            }else if(arr[0] === "help"){
                res.setHeader('Content-Type', 'application/json');
                res.send("LiveH2H Help!");
                /*
                res.send(JSON.stringify({
                    "response_type": "ephemeral",
                    attachments: [{
                        "fallback": "/liveh2h (@username | #channel) | /liveh2h meetnow (@username | #channel)| /liveh2h join xxx-xxx-xxx(9 Digit Meeting Number) | /liveh2h help",
                        title: "LiveH2H Commands:",
                        "mrkdwn_in":["text"],
                        "text": ":small_blue_diamond:`/liveh2h [@username | #channel]` Create a meeting and invite others using username or channel name _(For example: `/liveh2h @john @mary #general`)_ \n:small_blue_diamond: `/liveh2h meetnow [@username | #channel]` Create a meeting and invite others using username or channel name _(For example: `/liveh2h meetnow @john @mary #general`)_ \n :small_blue_diamond: `/liveh2h join xxx-xxx-xxx` Join a meeting using 9-digit meeting id _(For example: `/liveh2h join 123456789` or `/liveh2h join 123-456-789`)_ \n :small_blue_diamond: `/liveh2h help` Lists available commands \n For more features, visit: <https://www.liveh2h.com/|LiveH2H.com>",
                        "footer": "LiveH2H",
                        "footer_icon": "https://s3-us-west-2.amazonaws.com/slack-files2/avatar-temp/2016-09-18/80976650579_59e903b677a8359139ab.png",
                        "ts": timeStamp 
                    }]}));*/
                request.post(req.body.response_url,{
                    json:{
                    "response_type": "ephemeral",
                    attachments: [{
                        "fallback": "/liveh2h (@username | #channel) | /liveh2h meetnow (@username | #channel)| /liveh2h join xxx-xxx-xxx(9 Digit Meeting Number) | /liveh2h help",
                        title: "LiveH2H Commands:",
                        "mrkdwn_in":["text"],
                        "text": ":small_blue_diamond:`/liveh2h` Create a meeting _(For example: `/liveh2h`)_ \n:small_blue_diamond:`/liveh2h [@username | #channel]` Create a meeting and invite others using username or channel name _(For example: `/liveh2h @john @mary #general`)_ \n:small_blue_diamond: `/liveh2h meetnow [@username | #channel]` Create a meeting and invite others using username or channel name _(For example: `/liveh2h meetnow @john @mary #general`)_ \n :small_blue_diamond: `/liveh2h join xxx-xxx-xxx` Join a meeting using 9-digit meeting id _(For example: `/liveh2h join 123456789` or `/liveh2h join 123-456-789`)_ \n :small_blue_diamond: `/liveh2h help` Lists available commands \n For more features, visit: <https://www.liveh2h.com/|LiveH2H.com>",
                        "footer": "LiveH2H",
                        "footer_icon": "https://s3-us-west-2.amazonaws.com/slack-files2/avatar-temp/2016-09-18/80976650579_59e903b677a8359139ab.png",
                        "ts": timeStamp 
                    }]

                }},function(err,resp,body){
                    
                    if(err){
                         throw err;
                        winston.error(err);
                    }
                   
                })
            }else if(arr[0] === "join"){
                res.send("Creating meeting link - lookout for slackbot message!");
                var partstr ={"name": req.body.user_name.replace(/_/g, " ") ,"meetingId":arr[1].replace(/-/g,"")};
                request({
                    uri: "https://app.liveh2h.com/tutormeetweb/rest/v1/meetings/join",
                    method: 'POST',
                    json: partstr
                }, function(err,resp){
                    if(err){winston.error(err.message);throw err;}
                    PartURL = urlSlack+"&channel=%40"+req.body.user_name;
                    if(resp.body.returnCode === 14){
                        PartURL += "&text=Meeting Not Found!";
                    }else{
                        pLink = resp.body.data.meetingURL;
                        PartURL += '&attachments=' + encodeURIComponent('[{"text":"Hello! <'+pLink+'|Click here to join>"}]');
                    }

                    request.post(PartURL);
                });
            }else{
                res.send("I am sorry I didn't quite catch that! Type `/liveh2h help` for list of available commands.");
            }
        })
});

//Listening Command
/*app.listen('8093', function() {
  winston.info('Slack app is running on port', '8093');
});*/
    
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
            winston.info(err);
        }else{
            winston.info(resp.statusCode, body);
        }
    })
})