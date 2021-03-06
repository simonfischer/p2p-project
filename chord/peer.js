var requests = require('../utils/httpRequests');
requests = requests
const crypto = require('crypto');


var nullPeer = { id : "null", ip : "null", port: "null" };

function peer(port, succ_port, pred_port) {
  var _successor;
  var _predecessor;
  var _fingerTable = [];
  var _hashLength = 3;
  var _successorList = [];
  var _maxSuccessors = 3;
  var _predecessorSubscriptions = [];




  function hashId(id){
    if (process.env.NOHASHING == 'true') {
      return port
    }

    if(typeof process.env.HASH !== 'undefined'){
      return parseInt(process.env.HASH);
    }

    var hashString = crypto.createHash('sha256').update(id).digest('hex');
    hashString = hashString.slice(0, _hashLength);

    return parseInt(hashString, 16);
  }

  function createPeer(ip, port){
    return {id : hashId(ip + port), ip : ip, port: parseInt(port)};
  }

  var _this = createPeer('localhost', port);

  if (succ_port == "null") {
    setSuccessor(nullPeer);
  }
  else {
    setSuccessor(createPeer('localhost', succ_port));
    initFingertable();
  }


  if (pred_port == "null") {
    setPredecessor(nullPeer);
  }
  else {
    setPredecessor(createPeer('localhost', pred_port));
  }


  function get_this(){
    return _this;
  }

  function get_successor() {
    return _successor;
  }

  function get_predecessor() {
    return _predecessor;
  }

  function newPredecessorSubscribe(fn){
    _predecessorSubscriptions.push(fn);
  }

  function notifyPredecessor(){
    setPredecessor(nullPeer);
  }

  function notifySuccessor(node){
    setSuccessor(node);
  }

  function leave(){
    requests.deleteRequest(_successor, '/peerRequests/predecessor' , function(response){
          requests.putRequest(_predecessor, '/peerRequests/successor', _successor , function(response){
                

                setSuccessor(nullPeer);
                setPredecessor(nullPeer);

          });      
    });
  }

  function find_successor(id, callback) {
    // base case: only one node in ring, it is the successor of everything
    if (_this.id == _successor.id && _this.id == _predecessor.id) {
      callback(_this);
    }
    
    // if the searched id is between this node and its successor, return the successor
    // - EDGE CASE: if this node is the last in ring (successor has lower id), and the
    //              searched id is higher, return the successor (first node in ring)
    else if (_this.id == id) {
      // searched id equals this node's id; return self
      callback(_this);
    } 
    else if ((_this.id < id && id <= _successor.id)  || 
             (_successor.id < _this.id && (id > _this.id || id < _successor.id))) {
      // searched id is between this node and its successor; return successor¨
      callback(_successor);  
    }
    else {
      // searched id is not this node, nor its immediate neighbourhood;
      // pass request around the ring through our successor
      requests.getRequest(closestPreceedingFinger(id), '/peerRequests/find_successor/'+id, function(response){
            callback(JSON.parse(response));
      }, function(){
        sucessorGetRequest('/peerRequests/find_successor/'+id, function(response){
          callback(JSON.parse(response));
        });
      });
    }
  }

  function find_predecessor(id, callback) {
    // base case: only one node in ring, it is the predecessor of everything
    if (_this.id == _successor.id && _this.id == _predecessor.id) {
      callback(_this);
    }
    else if (id == _this.id) {
      callback(_predecessor);
    }
    else if ((_this.id < id && id <= _successor.id)  || 
             (_successor.id < _this.id && (id > _this.id || id < _successor.id))) {
      callback(_this);
    }
    else {
      requests.getRequest(closestPreceedingFinger(id), '/peerRequests/find_predecessor/'+id, function(response){
            callback(JSON.parse(response));
      });
    }
  }

  function notify(peer) {
    // base case: only one node in ring, the peer is now our new successor AND predecessor.
    if (_this.id == _successor.id && _this.id == _predecessor.id) {
      setPredecessor(peer);
      setSuccessor(peer);
    }

    // if the predecessor has left the network or is not known yet, accept the notify request
    else if (_predecessor.id == "null") {
      setPredecessor(peer);
    }

    // new node has joined, or stabilization attemts to update pointers
    else if ((peer.id < _this.id && peer.id > _predecessor.id) ||
             (_predecessor.id > _this.id && (peer.id > _predecessor.id || peer.id < _this.id))) {
      setPredecessor(peer);
    }

    else{

      requests.getRequest(_predecessor, '/peerRequests/find_successor/'+_this.id, function(response){}, function(){
        setPredecessor(peer);
      });

    }


  }

  var joined = true

  function join(peer) {
    joined = false;
    requests.getRequest(peer, '/peerRequests/find_successor/'+_this.id, function(response){

            setSuccessor(JSON.parse(response));     
            sucessorGetRequest('/peerRequests/find_predecessor/'+_successor.id, function(response){
              setPredecessor(JSON.parse(response));
              
              initFingertable();
              
            });
    });

    joined = true
  }


  function stabilize() {
    var tempSuccessor = _successor

    if (!joined) {
      return
    }
    if(tempSuccessor.id == "null" && _predecessor.id == "null"){
      return;
    }
    requests.getRequest(tempSuccessor, '/peerRequests/find_predecessor/'+tempSuccessor.id, function(response){
      var successorsPredecessor = JSON.parse(response);

      // if our successor has no predecessor, notify it of us
      if(JSON.stringify(successorsPredecessor) == JSON.stringify(nullPeer)){
  
        requests.postRequest(tempSuccessor, '/peerRequests/notify', _this , function(response){});
      }

      // if our successor's predecessor should actually be our new successor, update
      else if ((successorsPredecessor.id < tempSuccessor.id && successorsPredecessor.id > _this.id)
              || (_this.id > tempSuccessor.id && (successorsPredecessor.id > _this.id 
              || successorsPredecessor.id < tempSuccessor.id))) {
        tempSuccessor = successorsPredecessor;
        requests.postRequest(tempSuccessor, '/peerRequests/notify', _this , function(response){
          setSuccessor(tempSuccessor);
        });
      }
    }, function(){
      console.log("error in get request trying to stabilize");
    });
    fixSuccessorList();
  }


  var currentSuccessor = 0;
  function fixSuccessorList(){
    if(_successor.id == _this.id){
      return;
    }
    if(currentSuccessor == 0){
      // ask our successessor for his successor
       sucessorGetRequest('/peerRequests/successor', function(response){
        _successorList[currentSuccessor] = JSON.parse(response);
        currentSuccessor = (currentSuccessor + 1)%_maxSuccessors;
       });

    }else if (typeof _successorList[currentSuccessor-1] !== 'undefined'){
      // ask successor list to currentSuccessor - 1
      requests.getRequest(_successorList[currentSuccessor-1], '/peerRequests/successor', function(response){

        _successorList[currentSuccessor] = JSON.parse(response);

        currentSuccessor = (currentSuccessor + 1)%_maxSuccessors;
        
       }, function(){
        currentSuccessor = 0;
       });
    }
    
  }

  function getSuccessorList(){
    return _successorList;
  }

  function fix_fingers() {
    if(_successor.id == "null" ){
      return;
    }
    // find the successor peer of the key corresponding to the ith finger table
    // entry and update the table with this peer
    var i = Math.floor(Math.random() * (_fingerTable.length - 1)) + 1;
    ith_finger_start = fingerStart(i);

    sucessorGetRequest('/peerRequests/find_successor/'+ith_finger_start, function(response){
      fingerTableEntry = JSON.parse(response);
      fingerTableEntry.fingerID = fingerStart(i);
      _fingerTable[i] = fingerTableEntry;
    });
  }


  function setSuccessor(successor){
    _successor = successor;
    var tempSuccessor = JSON.parse(JSON.stringify(successor));

    tempSuccessor.fingerID = fingerStart(1);
    _fingerTable[1] = tempSuccessor;

  }

  function setPredecessor(predecessor){
    _predecessor = predecessor;
    for(i = 0; i < _predecessorSubscriptions.length; i++){
      _predecessorSubscriptions[i](_predecessor);
    }
  }

  
  function sucessorGetRequest(link, callback, errorCallback){
    //getRequest(peer, link, callback, errorCallback, tries)

    requests.getRequest(_successor, link, callback, function(){
      if(_successorList.length > 0){
        setSuccessor(_successorList.shift());

        sucessorGetRequest(link, function(response){
          requests.postRequest(_successor, '/peerRequests/notify', _this , function(response) {
            updateOthers();
          });
          callback(response);
        }, errorCallback);

      }else{
        if(typeof errorCallback !== 'undefined'){
          errorCallback();
        }
      }
    });
  }


  /////////////////////////
  ///// FINGERTABLES //////
  /////////////////////////

  function getFingertable(){
    return _fingerTable;
  }

  function initFingertable(i){
    if (typeof i === 'undefined') {
      i = 1;
    }
    if (i >= _hashLength*4) {
      requests.postRequest(_successor, '/peerRequests/notify', _this , function(response) {
        updateOthers();
      });
      return;
    }
    var fingerID = fingerStart(i+1);
    if(fingerID >= _this.id && fingerID < _fingerTable[i].id){
      _fingerTable[i+1] = JSON.parse(JSON.stringify(_fingerTable[i]));
      _fingerTable[i+1].fingerID = fingerID;
      initFingertable(i+1);
    }
    else {
      sucessorGetRequest( '/peerRequests/find_successor/'+fingerID, function(response) {
        returnedSuccessor = JSON.parse(response);

        returnedSuccessor.fingerID = fingerID;

        _fingerTable[i+1] = returnedSuccessor;
        initFingertable(i+1);
      });
    }
  }

  function updateOthers(i){
      if (typeof i === 'undefined') {
        i = 1;
      }
      if (i > _hashLength*4) {
        return;
      }
    
      var pred_search_id = (_this.id - Math.pow(2, i-1)).mod(Math.pow(2, _hashLength*4));
      sucessorGetRequest( '/peerRequests/find_predecessor/'+pred_search_id, function(response){
        returnedPredecessor = JSON.parse(response);
        requests.postRequest(returnedPredecessor, '/peerRequests/updateFingerTable', {peer : _this, i : i}, function(response){});
        updateOthers(i+1); 
      });
    
  }

  function is_between(this_id, between_peer, ith_finger, i) {
    // WHEN JOINING: this_id equals ith_finger, true when joining
    if(ith_finger == this_id){
      if(between_peer > this_id) {
        if(fingerStart(i) <= between_peer) {
          return true;
        }
      }

      if(between_peer < this_id){
        if(fingerStart(i) > this_id || fingerStart(i) <= between_peer){
          return true;
        }
      }
    }


    if (!(between_peer >= fingerStart(i) || 
         (ith_finger < fingerStart(i) && between_peer < ith_finger))) {
      // if between_peer is smaller than the finger table id it is supposed to be the immediate
      // successor of, then it obviously isn't, and we return false

      // otherwise, if the ith_finger is smaller than the finger table id it is the immediate
      // successor of, we are handling the over-the-top case, and we need to make sure that
      // the new between_peer is smaller than the previous ith_finger (to jump 'less' over the top)
      return false;
    }
    
    if (this_id <= between_peer && between_peer < ith_finger) {
      return true;
    }

    else if (ith_finger < this_id && between_peer < ith_finger) {
      return true;
    }

    else if (ith_finger < this_id && between_peer > this_id) {
      return true;
    }
    return false;
  }

  function updateFingerTable(peer, i){


    var hashMaxLength = (_hashLength * 4)-1;
    var ith_finger_node = _fingerTable[i].id;

    if(is_between(_this.id, peer.id, ith_finger_node, i)){
      peer.fingerID = _fingerTable[i].fingerID;
      _fingerTable[i] = peer;
      requests.postRequest(_predecessor, '/peerRequests/updateFingerTable', {peer : peer, i : i}, function(response){
      });
    }
  }

  function fingerStart(k){
    return (_this.id + Math.pow(2, k-1)) % Math.pow(2, _hashLength*4);
  }

  function closestPreceedingFinger(key) {
    for(i = _fingerTable.length-1; i > 0; i--) {
      if((_fingerTable[i].id >= _this.id && _fingerTable[i].id <= key) ||
         (key < _this.id && (_fingerTable[i].id > _this.id || _fingerTable[i].id < key))) {
        if(_fingerTable[i].id != _this.id) {
          return _fingerTable[i];
        }
      }
    }
    return _successor;
  }

  /////////////////////////
  //// FINGERTABLES END ///
  /////////////////////////


  if(process.env.STABILIZE == 'ON'){
    setInterval(stabilize, 1000);
    setInterval(fix_fingers, 1000);
  }





  return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      join : join,
      get_successor : get_successor,
      get_predecessor : get_predecessor,
      notify : notify,
      stabilize : stabilize,
      notifyPredecessor : notifyPredecessor,
      notifySuccessor : notifySuccessor,
      leave : leave,
      get_this : get_this,
      getFingertable : getFingertable,
      updateFingerTable : updateFingerTable,
      fix_fingers : fix_fingers,
      getSuccessorList : getSuccessorList,
      hashId : hashId,
      closestPreceedingFinger : closestPreceedingFinger,
      newPredecessorSubscribe : newPredecessorSubscribe
    }


}

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

module.exports = new peer(process.env.PORT, process.env.PORTSUCC, process.env.PORTPRED);
if (process.env.JOIN == 'true') {
  module.exports.join( {ip:'localhost', port:4000} )
}
