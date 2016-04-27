function chatOverlay(chordring, requests) {

	var _chordring = chordring;

	var _groups = [];


	function createGroupByName(name){
		var thisPeer = _chordring.get_this();
		var groupName = thisPeer.ip + ":" + thisPeer.port + ";" + name;
		create(groupName);
	}

	function create(groupName){
		var groupId = _chordring.hashId(groupName);
		var thisPeer = _chordring.get_this();

		_chordring.find_successor(groupId, function(successor){
			if(thisPeer.id == successor.id){
				_groups.push({groupName : groupName, children : [], rootNode : thisPeer});

			}else{
				requests.postRequest(successor, '/chat/'+groupName+'/create', {}, 
					function(){}, 
					function(){
						console.log("Create Request not successfull")
					}
				);
			}
		});	
	}

	function join(groupName, caller, callback) {

		var id = _chordring.hashId(groupName);
		var thisPeer = _chordring.get_this();
		var successor = _chordring.get_successor();
		var predecessor = _chordring.get_predecessor();

	    // base case: only one node in ring, it is the successor of everything
	    if (thisPeer.id == successor.id && thisPeer.id == predecessor.id) {
	      //callback(this);
	    }
	    
	    // if the searched id is between this node and its successor, return the successor
	    // - EDGE CASE: if this node is the last in ring (successor has lower id), and the
	    //              searched id is higher, return the successor (first node in ring)
	    else if (thisPeer.id == id) {
	      // searched id equals this node's id; return self
	      //callback(this);
	    } 
	    else if ((thisPeer.id >= id && id > predecessor.id)  || 
	             (predecessor.id > thisPeer.id && (id < thisPeer.id || id > predecessor.id))) {
	      // searched id is between this node and its successor; return successor¨

	  	  var group = searchInGroups(groupName);

	  	  if(group){
	  	  	group.children.push(caller);
	  	  }
	    }
	    else {
	      // searched id is not this node, nor its immediate neighbourhood;
	      // pass request around the ring through our successor
	      requests.postRequest(_chordring.closestPreceedingFinger(id), '/chat/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));
	      }, function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
	    }
	  }

	function leave(groupId){
		throw "leave not implemented yet"
	}

	function multicast(groupId, msg){
		throw "multicast not implemented yet"
	}

	function sendMulticast(groupId, msg){		
		throw "sendMulticast not implemented yet"
	}

	function searchInGroups(name){
		for(i = 0; i < _groups.length; i++){
			if(_groups[i].groupName == name){
				return _groups[i];
			}
		}
		return undefined;
	}

	return { create : create,
			 join : join,
			 leave : leave,
			 multicast : multicast,
			 createGroupByName : createGroupByName,
			 groups : _groups };

}

module.exports = chatOverlay;