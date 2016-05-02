var express = require('express');
var router = express.Router();

router.post('/:name/create', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var name = req.params.name;
  chatOverlay.create(name);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:name/createByName', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var name = req.params.name;
  chatOverlay.createGroupByName(name);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:name/join', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.name;
  var peer = req.body;
  chatOverlay.join(id, peer, function(){});
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/leave', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  var peer = req.body;
  chatOverlay.leave(id, peer); 
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/multicast', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  var msg = req.body.msg;
  var peer = req.body.peer;
  chatOverlay.multicast(id, msg, peer);  
  res.send(JSON.stringify({status : "ok"}));
});



module.exports = router;