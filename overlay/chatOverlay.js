function chatOverlay(chordring) {

	var _chordring = chordring;

	function create(groupId){
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
			 multicast : multicast };

}

module.exports = chatOverlay;