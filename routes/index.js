var express = require('express');
var router = express.Router();

var http = require('http').Server(router);
var io = require('socket.io')(http);


var middleware = require('socketio-wildcard')();

io.use(middleware);

io.on('connection', function(socket) {
  socket.on('*', function(){ 
    console.log("recived socketio-wildcard")
  });
});

io.listen(5000);

/*
var globalEvent = "*";
io.$emit = function (name) {
    if(!this.$events) return false;
    for(var i=0;i<2;++i){
        if(i==0 && name==globalEvent) continue;
        var args = Array.prototype.slice.call(arguments, 1-i);
        var handler = this.$events[i==0?name:globalEvent];
        if(!handler) handler = [];
        if ('function' == typeof handler) handler.apply(this, args);
        else if (io.util.isArray(handler)) {
            var listeners = handler.slice();
            for (var i=0, l=listeners.length; i<l; i++)
                listeners[i].apply(this, args);
        } else return false;
    }
    return true;
};

io.on('connection', function(socket){
  console.log("connection");
  socket.on(globalEvent, function(msg){
    console.log("got a *")
    io.emit('chat message', msg);
  });
});

http.listen(5000, function(){});*/


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

/* GET home page. */
router.get('/', handleBaseDesign);


module.exports = router;
