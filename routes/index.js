var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;

var http = require('http').Server(router);
var io = require('socket.io')(http);


var chat = null; 


io.on('connection', function(socket){
  if(chat != null){
    socket.emit("initialChats", {listOfChats : chat.getChats()});
  }
  socket.on('join', function(msg){
    if(chat != null){
      chat.handleCmd("join", msg);
    }
  });

  socket.on('leave', function(msg){ 
    if(chat != null){
      chat.handleCmd("leave", msg);
    }
  });

  socket.on('create', function(msg){ 
    if(chat != null){
      chat.handleCmd("create", msg);
    }
  });

  socket.on('sendmsg', function(msg){ 
    if(chat != null){
      chat.handleCmd("sendmsg", msg);
    }
  });

  socket.on('childNodes', function(msg){ 
    if(chat != null){
      chat.handleCmd("childNodes", msg, socket);
    }
  });

  socket.on('level', function(msg){ 
    if(chat != null){
      chat.handleCmd("level", msg, socket);
    }
  });

  socket.on('forceQuitNode', function(msg){ 
    var nodePortToQuit = msg.node;
    console.log("quitting : " + nodePortToQuit)
    exec('lsof -t -i tcp:' + nodePortToQuit + ' | xargs kill')
  });

  
});

var port = 1000 + parseInt(process.env.PORT);
http.listen(port, function(){});


function handleBaseDesign(req, res, next){
  var peer = req.app.get('peer');
  var overlayNetwork = req.app.get('overlayNetwork');

  console.log(JSON.stringify(peer.get_this()));
  
  res.render('index', 
    {thisPeer : peer.get_this() ,
    succ : peer.get_successor(), 
    pred : peer.get_predecessor(),
    fingerTable : peer.getFingertable(),
    successorList : peer.getSuccessorList(),
    groups : overlayNetwork.groups,
    topics : overlayNetwork.topics
  });
}

function initialRouter (chatArg){
  chat = chatArg;
  chat.setIo(io);
  return router;
}
/* GET home page. */
router.get('/', handleBaseDesign);


module.exports = initialRouter;
