var express = require('express');
var router = express.Router();

router.post('/:name/create', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');
  var name = req.params.name;
  overlayNetwork.create(name);
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
  res.setHeader('Access-Control-Allow-Origin', "*")
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
  var type = req.body.type;
  var currentPackageCount = req.body.currentPackageCount;
  overlayNetwork.multicast(id, msg, currentPackageCount, peer, statusCallback(res), type);  


});

function statusCallback(res){

    var isCalled = false;

    function reportStatus(status){
      if(!isCalled){
        if(status != "error"){
          res.send(JSON.stringify({status : "ok"}));
        }else{
          res.status(541).send('Something broke!');
        }
        isCalled = true;
      }else{
        console.log("You are trying to send a status multiple times")
      }
      
    }

    return reportStatus;

}

router.put('/updateBackup', function(req, res, next){
  var overlayNetwork = req.app.get('overlayNetwork');

  overlayNetwork.backupGroups(req.body);
  res.send(JSON.stringify({status : "ok"}));
});




module.exports = router;