var express = require('express');
var router = express.Router();

router.post('/:name/create', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var name = req.params.name;
  overlayNetwork.create(name);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:name/createByName', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var name = req.params.name;
  overlayNetwork.createGroupByName(name);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:name/join', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var id = req.params.name;
  var peer = req.body;
  overlayNetwork.join(id, peer, function(){});
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/leave', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var id = req.params.id;
  var peer = req.body;
  overlayNetwork.leave(id, peer); 
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/:id/multicast', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var id = req.params.id;
  var msg = req.body.msg;
  var peer = req.body.peer;
  overlayNetwork.multicast(id, msg, peer);  
  res.send(JSON.stringify({status : "ok"}));
});



module.exports = router;