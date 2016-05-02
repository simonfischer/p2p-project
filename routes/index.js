var express = require('express');
var router = express.Router();


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
