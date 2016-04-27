function chatOverlay(chordring, requests) {

	var _chordring = chordring;

	var _groups = [];


	function createGroupByName(name){
		var thisPeer = _chordring.get_this();
		var groupName = thisPeer.ip + ":" + thisPeer.port + ";" + name;

		var groupId = _chordring.hashId(groupName);
		console.log("find_successor is next");
		_chordring.find_successor(groupId, function(successor){
			
			requests.postRequest(successor, '/chat/'+groupName+'/create', {}, 
				function(){
					console.log("Successfull create request");
				}, 
				function(){
					console.log("Create Request not successfull")
				});
		});	
	}

	function create(name){
		var thisPeer = _chordring.get_this();
		var groupName = _thisPeer.ip + ":" + _thisPeer.port + ";" + name;

		var groupId = hashId(groupName);

		_chordring.find_successor(groupId, function(successor){



		});	


		throw "create not implemented yet" 
	}

	function join(groupId){
		throw "join not implemented yet"
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
	return { create : create,
			 join : join,
			 leave : leave,
			 multicast : multicast,
			 createGroupByName : createGroupByName };

}

module.exports = chatOverlay;