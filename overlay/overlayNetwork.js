
function overlayNetwork(chordring, requests) {

	var _chordring = chordring;

	var _groups = [];

	var _nullPeer = { id : "null", ip : "null", port: "null" };

	var _topicsList = { };

	var _backupForGroups = {};

	var _topicMessages = {};

	var _kBackups = 3;

	var _level = {};


	var _repairNetworkRequests = {};

	var _firstAidRequests = {};


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

				_groups.push({groupName : groupName, children : [], rootNode : thisPeer, currentPackageCount : 1, lastSeenPackage : 0, parent : _nullPeer});

			}else{
				requests.postRequest(successor, '/overlayNetwork/'+groupName+'/create', {}, 
					function(){}, 
					function(){
						console.log("Create Request not successfull")
					}
				);
			}
		});	
	}

	function getChildren(groupName){
		var group = searchInGroups(groupName)

		if(!group){
			return [];
		}
		return group.children;
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
	     group.parent = parent;
	     requests.postRequest(parent, '/overlayNetwork/'+ groupName +'/join', thisPeer ,function(response){
	            callback(JSON.parse(response));
	      }, function(){ 

	      	requests.postRequest(_chordring.get_successor(), '/overlayNetwork/'+ groupName +'/join', thisPeer ,function(response){
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

		requests.postRequest(parent, '/overlayNetwork/'+ groupName +'/leave', thisPeer ,function(response){}, 
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

			    response("ok");
				heartBeatFromParent(msg);
				break;

			case "repairRequest":
				response("ok")
				handleRepairRequest(groupName, msg)
				break;
			case "firstAidRequest":

				response("ok")
				handleFirstAidRequest(groupName, msg);
				break;
		}	
		

	}


	function multicastMsg(groupName, msg, currentPackageCount, caller, response, type){
		if(typeof type == 'undefined'){
			type="msg";
		}
		if(typeof response == 'undefined'){
			response = function(arg){}
		}
		if(!caller.id){
			caller.id = _chordring.hashId(caller.ip + caller.port);
		}
		var thisPeer = _chordring.get_this();
		var group = searchInGroups(groupName);
		if(typeof group == 'undefined'){
			if(typeof currentPackageCount == 'undefined'){
				if(_backupForGroups[groupName]){
					// TODO: check if the network is actually rootNode?
					_groups.push(_backupForGroups[groupName])


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
			requests.postRequest(rootNode, '/overlayNetwork/'+ groupName +'/multicast', { msg : msg, peer : thisPeer, currentPackageCount : currentPackageCount} ,function(response){}, 
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
						requests.postRequest(parent, '/overlayNetwork/'+ groupName +'/leave', thisPeer ,function(responseCode){
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

			
			
			var messageToChilden = { msg : msgToSend, peer : thisPeer, currentPackageCount : newPackageCount, type : type};

			if(_topicsList[groupName]){
				if(typeof _topicMessages[groupName] == 'undefined'){
					_topicMessages[groupName] = [{currentPackageCount : 0}];
				}

				var lastSeenPackage = _topicMessages[groupName].slice(-1)[0].currentPackageCount;

				if((lastSeenPackage + 1) < currentPackageCount){
					repairNetwork(groupName, currentPackageCount);
	
				}
				else if ((lastSeenPackage+1) == currentPackageCount){


					_topicMessages[groupName].push(messageToChilden);
		
					// if there is a message handler associated with the group name, i.e. we're interested, pass the msg
					_topicsList[groupName](groupName, msgToSend);
					
				}

			}

			for(i = 0; i < children.length; i++){

				requests.postRequest(children[i], '/overlayNetwork/'+ groupName +'/multicast', messageToChilden ,function(response){}, 
					function(){ console.log("Multicast didnt succeed")});
			}
			response("ok");
		}
	}


	function messageIsInList(messageToCheck, listToCheck){
		var j = 0;
		if(typeof listToCheck == 'undefined'){
			return false;
		}
		for (j = 0; j < listToCheck.length; j++){
			if(listToCheck[j].startOfInterval == messageToCheck.startOfInterval
				&& listToCheck[j].endOfInterval == messageToCheck.endOfInterval){
				listToCheck.splice(j, 1)
				return true;
			}
		}
		return false;
	}

	function messageIsInListFirstAid(messages, listToCheck){
		if(typeof messages == 'undefined' || typeof messages.messages == 'undefined' || typeof listToCheck == 'undefined'){
			return false;
		}

		var j = 0;
		messages = messages.messages;

		var startOfInterval = messages[0].currentPackageCount;
		var endOfInterval = messages.slice(-1)[0].currentPackageCount;

		for (j = 0; j < listToCheck.length; j++){

			var listStartOfInterval = listToCheck[j].messages[0].currentPackageCount;
			var listEndOfInterval = listToCheck[j].messages.slice(-1)[0].currentPackageCount;

			if(listStartOfInterval == startOfInterval
				&& listEndOfInterval == endOfInterval){
				listToCheck.splice(j, 1)
				return true;
			}
		}
		return false;
	}

	function repairNetwork(groupName, incommingPackage, delayed){
		var lastSeenPackage = _topicMessages[groupName].slice(-1)[0].currentPackageCount;
		var message = { startOfInterval: lastSeenPackage + 1, endOfInterval: incommingPackage}

		if(typeof delayed == 'undefined'){
			if(typeof _repairNetworkRequests[groupName] == 'undefined'){
				_repairNetworkRequests[groupName] = [];
			}

			_repairNetworkRequests[groupName].push(message);

			var delayTimer = generateDelayTimer(groupName);


			setTimeout(function(){
				repairNetwork(groupName, incommingPackage, true);
			},
			delayTimer);

			return;
		}

		if(!messageIsInList(message, _repairNetworkRequests[groupName])){
			return;
		}

		if (lastSeenPackage >= incommingPackage){
			return;
		}



		var group = searchInGroups(groupName);

		var rootNode = group.rootNode;

		if(rootNode.id == _nullPeer.id){

			_chordring.find_successor(_chordring.hashId(group.groupName), function(successor){
				group.rootNode = successor;
				repairNetwork(groupName);
			});
			return;
		}
		var lastSeenPackage = _topicMessages[groupName].slice(-1)[0].currentPackageCount + 1;

		var message = { startOfInterval: lastSeenPackage, endOfInterval: incommingPackage}
		console.log("SEND REPAIR REQUEST i am " + _chordring.get_this().id)
		requests.postRequest(rootNode, '/overlayNetwork/'+ groupName +'/multicast', 
			{ msg : message, peer : _chordring.get_this(), type : "repairRequest"},

			function(response){}, 
			function(){ 
				group.rootNode = _nullPeer;
				repairNetwork(groupName, incommingPackage);
			});
		

	}

	function handleFirstAidRequest(groupName, msg){
	
		var group = searchInGroups(groupName);
		var children = group.children;
	
		var messageToSend = { msg : msg, peer : _chordring.get_this(), type : "firstAidRequest"};
		checkForUpdates(groupName, msg.messages);
		for(i = 0; i < children.length; i++){
			requests.postRequest(children[i], '/overlayNetwork/'+ groupName +'/multicast', messageToSend,function(response){}, 
				function(){ console.log("Multicast didnt succeed")});
		}

	}

	function checkForUpdates(groupName, messages){
		var firstMessage = messages[0];
		var lastMessage = messages.slice(-1)[0];


		var message = { startOfInterval: firstMessage.currentPackageCount, endOfInterval: lastMessage.currentPackageCount};
		messageIsInList(message, _repairNetworkRequests[groupName]);


		messageIsInListFirstAid(messages, _firstAidRequests[groupName]);

		var group = searchInGroups(groupName);

		var currentMessageList = _topicMessages[groupName];

		if(typeof currentMessageList != 'undefined'){
			
			

			for(i = 0; i < messages.length; i++){
				var currentNewest = _topicMessages[groupName].slice(-1)[0].currentPackageCount;
				
				var newestMessage = messages[i].currentPackageCount;

				if(newestMessage > currentNewest){
					_topicMessages[groupName].push(messages[i]);
					_topicsList[groupName](groupName, messages[i].msg);

				}

			}

		}

	}

	function handleRepairRequest(groupName, msg){
		var startOfInterval = msg.startOfInterval;
		var endOfInterval = msg.endOfInterval;
		var group = searchInGroups(groupName);


		if(_topicMessages[groupName]){
			var lastSeenPackage = _topicMessages[groupName].slice(-1)[0].currentPackageCount;

			if(lastSeenPackage >= endOfInterval){

				var listToSend  = _topicMessages[groupName].slice(startOfInterval, (endOfInterval + 1))
				
				
				if(group.rootNode.id == _nullPeer.id){
					_chordring.find_successor(_chordring.hashId(group.groupName), function(successor){
						group.rootNode = successor;
						handleRepairRequest(groupName, msg);
					});
					return;
				}
				var lastSeenPackage = _topicMessages[groupName].slice(-1)[0].currentPackageCount + 1;

				var message = { messages : listToSend }

				if(typeof _firstAidRequests[groupName] == 'undefined'){
					_firstAidRequests[groupName] = [];
				}

				_firstAidRequests[groupName].push(message);
				var timeDelay = generateDelayTimer(groupName);

				setTimeout(function(){

					if(!messageIsInListFirstAid(message, _firstAidRequests[groupName])){
						return;
					}

					requests.postRequest(group.rootNode, '/overlayNetwork/'+ groupName +'/multicast', 
						{ msg : message, peer : _chordring.get_this(), type : "firstAidRequest"},

						function(response){}, 
						function(){ 
							group.rootNode = _nullPeer;
							handleRepairRequest(groupName, msg);
						});
				},timeDelay);
			}


		}



		var children = group.children;


		var messageToSend = { msg : msg, peer : _chordring.get_this(), type : "repairRequest"};


		messageIsInList(msg, _repairNetworkRequests[groupName]);


		for(i = 0; i < children.length; i++){
			requests.postRequest(children[i], '/overlayNetwork/'+ groupName +'/multicast', messageToSend,function(response){}, 
				function(){ console.log("Multicast didnt succeed")});
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

	    requests.putRequest(successor, '/overlayNetwork/updateBackup', data , function(response){});
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
			requests.putRequest(successor, '/overlayNetwork/updateBackup', backupData, function(response){});
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

		requests.putRequest(predecessor, '/overlayNetwork/updateBackup', data , function(response){
			requests.postRequest(predecessor, '/overlayNetwork/'+ group.groupName +'/join', thisPeer ,function(response){}, 
				function(){ console.log("Error post requesting to closestPreceedingFinger in chatOverlay")});
		});
	}

	_chordring.newPredecessorSubscribe(newPredecessorInChordRing)


	var _lastHeartBeat = {};


	var _c1 = 15;
	var _c2 = 10;


	function generateDelayTimer(groupName){

		var level = _level[groupName];

		if(typeof level == 'undefined'){
			level = 1;
		}

		var time = _c1*level+generateRandomNumber()*level;

		return time;
	}

	function generateRandomNumber() {
    	var min = 0;
        var max = _c2;
        var highlightedNumber = parseFloat((Math.random() * (max - min) + min).toFixed(3));

	    return highlightedNumber;
	}

	function heartBeatFromParent(msg){
		if(typeof msg.level != 'undefined'){
			_level[msg.groupName] = msg.level + 1;
		}
		_lastHeartBeat[msg.groupName] = new Date().getTime();
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
				join(groupName, thisPeer, function(){}, _topicsList[groupName]);

			}

		}
		

		
	}

	function heartBeatToChildren(){
		var thisPeer = _chordring.get_this();

		for(i = 0; i < _groups.length; i++){
			for(j = _groups[i].children.length-1; j >= 0; j--){
				var child = _groups[i].children[j];	
				var currentChildList = _groups[i].children;
				if(_groups[i].rootNode.id == thisPeer.id){
					_level[_groups[i].groupName] = 1;
				}



				requests.postRequest(child, '/overlayNetwork/'+ _groups[i].groupName +'/multicast', { msg : {groupName : _groups[i].groupName, level : _level[_groups[i].groupName]}, peer : thisPeer, type : "heartBeat"} ,function(response){}, 
					function(){
						deleteInChildren({id : child.id}, currentChildList)
					});
			}
		}

	}


	function get_this(){
		return _chordring.get_this();
	}

	function getLevel(groupName){
		return _level[groupName];
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
   		     backupGroups : backupGroups,
   		     getChildren : getChildren,
   		     get_this : get_this,
   		     getLevel : getLevel };

}

module.exports = overlayNetwork;