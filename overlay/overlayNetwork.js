function overlayNetwork(chordring, requests) {

	var _chordring = chordring;

	var _groups = [];

	var _nullPeer = { id : "null", ip : "null", port: "null" };

	var _topicsList = { };

	var _backupForGroups = {};

	var _kBackups = 3;


	// Functionality moved to chat.js
	// function createGroupByName(name){
	// 	var thisPeer = _chordring.get_this();
	// 	var groupName = thisPeer.ip + ":" + thisPeer.port + ";" + name;
	// 	create(groupName);
	// }

	function create(groupName){
		var groupId = _chordring.hashId(groupName);
		var thisPeer = _chordring.get_this();

		_chordring.find_successor(groupId, function(successor){
			if(thisPeer.id == successor.id){

	  	    	//console.log("pushing group on list create " )
				_groups.push({groupName : groupName, children : [], rootNode : thisPeer, currentPackageCount : 1, lastSeenPackage : 0, parent : _nullPeer});

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

	function join(groupName, caller, callback, msgHandlerFn) {
		if(!caller.id){
			caller.id = _chordring.hashId(caller.ip + caller.port);
		}
		var id = _chordring.hashId(groupName);
		var thisPeer = _chordring.get_this();
		var successor = _chordring.get_successor();
		var predecessor = _chordring.get_predecessor();

		var group = searchInGroups(groupName);


		

	  	if(!group){
	  	//	console.log("pushing group on list join " + group )

  			_groups.push({groupName : groupName, children : [], rootNode : _nullPeer, lastSeenPackage : 0, parent : _nullPeer});
  			group = searchInGroups(groupName);
	  	}


	  	if(searchInChildren(caller, group.children)){
	  		return;
	  	}

	  	if(caller.id == thisPeer.id){
	     	_topicsList[groupName] = msgHandlerFn;
		}

	    // base case: only one node in ring, it is the successor of everything
	    if (thisPeer.id == successor.id && thisPeer.id == predecessor.id) {
	      //callback(this);
	    }
	    
	    
	    else if ((thisPeer.id >= id && id > predecessor.id)  || 
	             (predecessor.id > thisPeer.id && (id < thisPeer.id || id > predecessor.id)) ||
	             thisPeer.id == id) {
	    	
	    	if(_backupForGroups[groupName]){
	    		var backupGroup = _backupForGroups[groupName];
	    		if(typeof group.currentPackageCount == 'undefined' || group.currentPackageCount < backupGroup.currentPackageCount){

	    			group.currentPackageCount = backupGroup.currentPackageCount;
	    			group.rootNode = thisPeer;
	    		}
	  		}

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
	     console.log("calling parent: " + parent.id)
	     group.parent = parent;
	     requests.postRequest(parent, '/chat/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));
	      }, function(){ 

	      	requests.postRequest(_chordring.get_successor(), '/chat/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));}, function(){});

	      });
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
		

		if(group.children.length > 0 || _topicsList[groupName]){
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

	function multicast(groupName, msg, currentPackageCount, caller, response, type){
		if(typeof type == 'undefined'){
			type = "msg";
		}
		switch(type){
			case "msg":
				multicastMsg(groupName, msg, currentPackageCount, caller, response)
				break;

			case "heartBeat":
				heartBeatFromParent(msg);
		}
		

	}

	function multicastMsg(groupName, msg, currentPackageCount, caller, response){
		if(typeof response == 'string'){
			console.log("response is a string containing: " + response)
			//response = function(arg){}
		}
		if(typeof response == 'undefined'){
			response = function(arg){}
		}
		if(!caller.id){
			caller.id = _chordring.hashId(caller.ip + caller.port);
		}
		var thisPeer = _chordring.get_this();
		var group = searchInGroups(groupName);
		if(!group){
			if(typeof currentPackageCount == 'undefined'){
				if(_backupForGroups[groupName]){
					// TODO: check if the network is actually rootNode?
					group.push(_backupForGroups[groupName])
					multicast(groupName, msg, currentPackageCount, caller, response)
				}else{
					response("error");
				}
			}else{
				response("error");
			}
			return;
		}
		var rootNode = group.rootNode;
		if(rootNode.id == _nullPeer.id){
			_chordring.find_successor(_chordring.hashId(group.groupName), function(successor){
				group.rootNode = successor;
				multicast(groupName, msg, currentPackageCount, caller, response);
			});
			return;
		}
		if(thisPeer.id == caller.id && thisPeer.id != rootNode.id){
			requests.postRequest(rootNode, '/chat/'+ groupName +'/multicast', { msg : msg, peer : thisPeer, currentPackageCount : currentPackageCount} ,function(response){}, 
				function(){ 
					group.rootNode = _nullPeer;
					multicast(groupName, msg, currentPackageCount, caller, response);
				});


		}else{

			var children = group.children;
			var msgToSend = msg;
			
			var newPackageCount = currentPackageCount;


			if(group.rootNode.id == thisPeer.id){
				newPackageCount = group.currentPackageCount;
				currentPackageCount = group.currentPackageCount;
				group.currentPackageCount = group.currentPackageCount + 1;
			}


			if(typeof currentPackageCount == 'undefined'){
				if(!_backupForGroups[groupName]){
					console.log("Someone thinks we are root node, but we are not, we are " + thisPeer.id)
					response("error");
					return;
				}

				var groupId = _chordring.hashId(groupName);

				_chordring.find_successor(groupId, function(successor){
					if(thisPeer.id == successor.id){
						var backupGroup = _backupForGroups[groupName];

						group.rootNode = thisPeer;
						group.currentPackageCount = backupGroup.currentPackageCount;
						

						var children = group.children.concat(backupGroup.children);

						children = children.filter(function (item, pos) {

							return children.indexOf(item) == pos;
						});

						group.children = children;

						var parent = group.parent;
						if(!parent){
							multicast(groupName, msg, currentPackageCount, caller, response)
							return;
						}
						requests.postRequest(parent, '/chat/'+ groupName +'/leave', thisPeer ,function(responseCode){
							group.parent = _nullPeer;
							multicast(groupName, msg, currentPackageCount, caller, response)
						}, 
						function(){ 
							response("error");
							console.log("Error post requesting to closestPreceedingFinger in chatOverlay")
						});
					}else{
						response("error");
					}
				});	

				
				return;

			}

			

			// update last seen message count
			var lastSeenPackage = group.lastSeenPackage;

		/*	if((lastSeenPackage + 1) != currentPackageCount){
				console.log("lastseen " + lastSeenPackage + " current: " + currentPackageCount)
				repairNetwork();

				return;
			}else{*/
			group.lastSeenPackage = currentPackageCount;
			//}
			
			if(_topicsList[groupName]){
				// if there is a message handler associated with the group name, i.e. we're interested, pass the msg
				_topicsList[groupName](groupName, msgToSend);
			}

			for(i = 0; i < children.length; i++){

				requests.postRequest(children[i], '/chat/'+ groupName +'/multicast', { msg : msgToSend, peer : thisPeer, currentPackageCount : newPackageCount, type : "msg"} ,function(response){}, 
					function(){ console.log("")});
			}
			response("ok");
		}
	}

	function repairNetwork(){

		console.log("REPAIR NETWORK");
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

	function backupSuccessors(){
		var successor = _chordring.get_successor();
		var thisPeer = _chordring.get_this();
		var groups = groupsForRootNode();

	    if(successor.id == "null" || successor.id == thisPeer.id){
	      return;
	    }


	    if(groups.length == 0){
	      return;
	    }

	    var data = {ithPeer : _kBackups, groups : groups, originator : thisPeer}

	    requests.putRequest(successor, '/chat/updateBackup', data , function(response){});
	}

	function groupsForRootNode(){
		var thisPeer = _chordring.get_this();
		var groups = [];
		for(i = 0; i < _groups.length; i++){
			if(_groups[i].rootNode.id == thisPeer.id){
				var group = JSON.parse(JSON.stringify(_groups[i]));
				delete group["lastSeenPackage"];
				groups.push(group)
			}
		}
		return groups;
	}

	function backupGroups(backupData){
		var groups = backupData.groups;
		var ithPeer = backupData.ithPeer;
		var successor = _chordring.get_successor();
		updateGroups(groups);

		if(backupData.originator.id == successor.id){
			return;
		}

		ithPeer--;

		if(ithPeer > 0){
			backupData.ithPeer = ithPeer;
			requests.putRequest(successor, '/chat/updateBackup', backupData, function(response){});
		}

	}

	function updateGroups(groups){


		for(i = 0; i < groups.length; i++){
			_backupForGroups[groups[i].groupName] = groups[i];
		}
	}

	function newPredecessorInChordRing(predecessor){
		var thisPeer = _chordring.get_this();
		for(i = 0; i < _groups.length; i++){
			if(_groups[i].rootNode.id == thisPeer.id){
				checkGroupForNewRootNode(_groups[i], predecessor);
			}
		}
	}

	function checkGroupForNewRootNode(group, predecessor){
		var groupId = _chordring.hashId(group.groupName);
		var thisPeer = _chordring.get_this();
		var successor = _chordring.get_successor();
		if (predecessor.id == successor.id && thisPeer.id == predecessor.id) {
	      return;
	    }
	    
	    if ((predecessor.id < groupId && groupId <= thisPeer.id)  || 
	             (thisPeer.id < predecessor.id && (groupId > predecessor.id || groupId < thisPeer.id))) {
	      return;  
	    }

		group.rootNode = predecessor;

		var data = {ithPeer : 0, groups : [group]}

		requests.putRequest(predecessor, '/chat/updateBackup', data , function(response){
			requests.postRequest(predecessor, '/chat/'+ group.groupName +'/join', thisPeer ,function(response){}, 
				function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
		});
	}

	_chordring.newPredecessorSubscribe(newPredecessorInChordRing)


	var _lastHeartBeat = {};

	function heartBeatFromParent(msg){
		_lastHeartBeat[msg] = new Date().getTime();
	}

	function checkHeartBeat(){
		var thisPeer = _chordring.get_this();
		for(i = 0; i < _groups.length; i++){
			var groupName = _groups[i].groupName;

			if(typeof _lastHeartBeat[groupName] == 'undefined'){
				return;
			}
			if (new Date().getTime() - _lastHeartBeat[groupName] > 10000){
				_lastHeartBeat[groupName] = undefined;
				console.log("JOINING")
				join(groupName, thisPeer, function(){}, _topicsList[groupName]);

			}

		}
		

		
	}

	function heartBeatToChildren(){
		var thisPeer = _chordring.get_this();
		for(i = 0; i < _groups.length; i++){
			for(j = 0; j < 
				_groups[i].children.length; j++){
				var child = _groups[i].children[j];	
			
				requests.postRequest(child, '/chat/'+ child.groupName +'/multicast', { msg : _groups[i].groupName, peer : thisPeer, type : "heartBeat"} ,function(response){}, 
					function(){ console.log("")});
			}
		}

	}

	setInterval(heartBeatToChildren, 1000);

    setInterval(backupSuccessors, 1000);

    setInterval(checkHeartBeat, 5000)

	return { create : create,
			 join : join,
			 leave : leave,
			 multicast : multicast,
			 groups : _groups,
			 topics : _topicsList,
   		     backupGroups : backupGroups };

}

module.exports = overlayNetwork;