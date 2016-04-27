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
  chatOverlay.leave(id);  
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/multicast', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  var msg = req.body.msg;
  chatOverlay.multicast(id, msg);  
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/sendMulticast', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  var msg = req.body.msg;
  chatOverlay.sendMulticast(id, msg);  
  res.send(JSON.stringify({status : "ok"}));
});

module.exports = router;