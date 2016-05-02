function chatOverlay(chordring, requests) {

	var _chordring = chordring;

	var _groups = [];

	var _nullPeer = { id : "null", ip : "null", port: "null" };

	var _topicsList = { };

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

		var group = searchInGroups(groupName);


		

	  	if(!group){
	  		_groups.push({groupName : groupName, children : [], rootNode : _nullPeer});
	  		group = searchInGroups(groupName);
	  	}


	  	if(searchInChildren(caller, group.children)){
	  		return;
	  	}

	  	if(caller.id == thisPeer.id){
	     	_topicsList[groupName] = true;
		}

	    // base case: only one node in ring, it is the successor of everything
	    if (thisPeer.id == successor.id && thisPeer.id == predecessor.id) {
	      //callback(this);
	    }
	    
	    
	    else if ((thisPeer.id >= id && id > predecessor.id)  || 
	             (predecessor.id > thisPeer.id && (id < thisPeer.id || id > predecessor.id)) ||
	             thisPeer.id == id) {
	  	  if(caller.id != thisPeer.id){
	  	  	group.children.push(caller);
	  	  }
	    }
	    else {
	      // searched id is not this node, nor its immediate neighbourhood;
	      // pass request around the ring through our successor
	     if(caller.id != thisPeer.id){
	     	group.children.push(caller);
	     }
	     requests.postRequest(_chordring.closestPreceedingFinger(id), '/chat/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));
	      }, function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
	    }
	  }

	function leave(groupName){
		delete _topicsList[groupName];
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

	function searchInChildren(caller, children){
		for(i = 0; i < children.length; i++){
			if(children[i].id == caller.id){
				return children[i];
			}
		}
		return undefined;
	}

	return { create : create,
			 join : join,
			 leave : leave,
			 multicast : multicast,
			 createGroupByName : createGroupByName,
			 groups : _groups,
			 topics : _topicsList };

}

module.exports = chatOverlay;