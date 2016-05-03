var express = require('express');
var router = express.Router();

var http = require('http').Server(router);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log("connection");
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(5000, function(){});


function handleBaseDesign(req, res, next){
  var peer = req.app.get('peer');
  var chatOverlay = req.app.get('chatOverlay');

  console.log(JSON.stringify(peer.get_this()));
  res.render('index', 
    {thisPeer : peer.get_this() ,
    succ : peer.get_successor(), 
    pred : peer.get_predecessor(),
    fingerTable : peer.getFingertable(),
    successorList : peer.getSuccessorList(),
    groups : chatOverlay.groups,
    topics : chatOverlay.topics
  });
}

/* GET home page. */
router.get('/', handleBaseDesign);


module.exports = router;
