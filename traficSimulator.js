var io = require('socket.io-client');

var numberOfPeers = 10;
var numberOfRuns = 1;

var sockets = [];

var messages = ["hej med dig", "maskinerne kommer", "denne chat er awesome", "marc er mærkeligt", "simon er awesome"]

function getRandomMessage(){
	return messages[Math.floor(Math.random()*messages.length)];
}

for(i = 0; i < numberOfPeers; i++){
	var port = 5000 + i;
	sockets[i] = io.connect('http://localhost:' + port);
	console.log("connecting to http://localhost:" + port)
}


sockets[0].emit('create', { groupName : "test"})



function joinGroup(i){
	sockets[i].emit('join', { groupName : "localhost:4000;test"})
	sockets[i].on('newChatMessage', function(msg){ 
		console.log("timelaps: " + (Date.now() - msg.msg));
	});

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
			sockets[i].emit('sendmsg', { msg : Date.now(), groupName : "localhost:4000;test"})
		}
	}

}
setTimeout(function(){
	joinGroup(0);
}, 500);







