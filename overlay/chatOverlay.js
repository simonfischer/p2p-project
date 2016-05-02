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
				_groups.push({groupName : groupName, children : [], rootNode : thisPeer, parent : _nullPeer});

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
	  		_groups.push({groupName : groupName, children : [], rootNode : _nullPeer, parent : _nullPeer});
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
	     var parent = _chordring.closestPreceedingFinger(id);
	     group.parent = parent;
	     requests.postRequest(parent, '/chat/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));
	      }, function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
	    }
	  }

	function leave(groupName, caller){
		var thisPeer = _chordring.get_this();
		var group = searchInGroups(groupName);

		
		if(!group){
			console.log("Group doesnt exists when trying to leave. THIS SHOULD NOT HAPPEN")
			return;
		}

		if(thisPeer.id == caller.id){
			delete _topicsList[groupName];
		}else{
			var children = group.children;
			deleteInChildren(caller, children);
		}
		

		if(group.children.length > 0){
			return;
		}

		var parent = group.parent;

		deleteInGroups(groupName);

		if(!parent){
			return;
		}

		requests.postRequest(parent, '/chat/'+ groupName +'/leave', thisPeer ,function(response){}, 
			function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
	}

	function multicast(groupName, msg, caller){
		var thisPeer = _chordring.get_this();
		var group = searchInGroups(groupName);
		if(!group){
			console.log("Group doesnt exists when trying to multicast. THIS SHOULD NOT HAPPEN");
			return;
		}
		if(thisPeer.id == caller.id){
			var rootNode = group.rootNode;
			if(rootNode.id == _nullPeer.id){
				_chordring.find_successor(_chordring.hashId(group.groupName), function(successor){
					group.rootNode = successor;
					multicast(groupName, msg, caller);
				});
				return;
			}
			requests.postRequest(rootNode, '/chat/'+ groupName +'/multicast', { msg : msg, peer : thisPeer} ,function(response){}, 
				function(){ console.log("")});


		}else{
			var children = group.children;

			if(_topicsList[groupName]){
				messageHandler(groupName, msg);
			}

			for(i = 0; i < children.length; i++){
				requests.postRequest(children[i], '/chat/'+ groupName +'/multicast', { msg : msg, peer : thisPeer} ,function(response){}, 
					function(){ console.log("")});
			}
		}

	}


	function searchInGroups(name){
		for(i = 0; i < _groups.length; i++){
			if(_groups[i].groupName == name){
				return _groups[i];
			}
		}
		return undefined;
	}

	function deleteInGroups(name){
		for(i = 0; i < _groups.length; i++){
			if(_groups[i].groupName == name){
				return _groups.splice(i, 1);
			}
		}
	}

	function deleteInChildren(caller, children){
		for(i = 0; i < children.length; i++){
			if(children[i].id == caller.id){
				return children.splice(i, 1);
			}
		}
	}


	function searchInChildren(caller, children){
		for(i = 0; i < children.length; i++){
			if(children[i].id == caller.id){
				return children[i];
			}
		}
		return undefined;
	}

	function messageHandler(groupName, msg){

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