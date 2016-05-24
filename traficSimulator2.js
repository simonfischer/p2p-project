var io = require('socket.io-client');

var numberOfPeers = 30;
var numberOfRuns = 1;

var sockets = [];
var level = [];

var currentLevel;
var maxLevel = 0;

var messages = ["hej med dig", "maskinerne kommer", "denne chat er awesome", "marc er mærkeligt", "simon er awesome"]

function getRandomMessage(){
	return messages[Math.floor(Math.random()*messages.length)];
}

for(i = 0; i < numberOfPeers; i++){
	var port = 5000 + i;
	sockets[i] = io.connect('http://localhost:' + port);
	console.log("connecting to http://localhost:" + port)
	sockets[i].on('levelValue', levelUpdate(i));

	function levelUpdate(j){
		function updateLevel(msg){
			level[j] = msg.level;
			if(level[j] > maxLevel){
				maxLevel = level[j];
				console.log(maxLevel);
			}
		}
		return updateLevel;
	}
}


sockets[0].emit('create', { groupName : "test2"})



function joinGroup(i){
	console.log(i)
	sockets[i].emit('join', { groupName : "localhost:4000;test2"})

	
	sockets[i].on('newChatMessage', handleMessageI(i));
	function handleMessageI(j){
		function handleMessage(msg){ 
			if(typeof currentLevel == "undefined"){
				return;
			}
			if(currentLevel == level[j]){

				console.log(currentLevel + ", " + (Date.now() - msg.msg));
			}
		}
		return handleMessage;
	}
	i = i + 1;	
	if(i < numberOfPeers){
		setTimeout(function(){
			joinGroup(i);
		}, 300);
	}else{
		setTimeout(bloatWithMessages, 1000);
	}
	
}


function bloatWithMessages(){
	for(j = 0; j < numberOfRuns; j++){
		for(i = 0; i < numberOfPeers; i++){
			console.log(" j : " + j + "    i : " + i)
			sockets[i].emit('sendmsg', { msg : Date.now(), groupName : "localhost:4000;test2"})
		}
	}

}



setTimeout(function(){
	joinGroup(0);
}, 500);

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    if(d.toString().trim() == "level"){
    	for(i = 0; i < numberOfPeers; i++){

    		sockets[i].emit('level', {groupName : "localhost:4000;test2"})
    	}
    }else{
    	var levelToAsk = parseInt(d.toString().trim())
    	currentLevel = levelToAsk
    	for(i = 0; i < numberOfPeers; i++){
    		if(level[i] == levelToAsk){
    			sockets[i].emit('sendmsg', { msg : Date.now(), groupName : "localhost:4000;test2"})
    		}
    	}

    }
});


