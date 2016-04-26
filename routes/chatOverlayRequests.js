var express = require('express');
var router = express.Router();

router.post('/:id/create', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  chatOverlay.create(id);

  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/join', function(req, res, next){
  var chatOverlay = req.app.get('chatOverlay');
  var id = req.params.id;
  chatOverlay.join(id);
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