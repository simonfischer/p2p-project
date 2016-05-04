var io = require('socket.io-client');

var numberOfPeers = 2;

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


sockets[0].emit('create', { groupName : "testGroup"})

for(i = 0; i < numberOfPeers; i++){
	 sockets[i].emit('join', { groupName : "testGroup"})
}


function bloatWithMessages(){
	for(i = 0; i < numberOfPeers; i++){
		sockets[i].emit('sendmsg', { msg : getRandomMessage(), groupName : "testGroup"})
	}
	setTimeout(bloatWithMessages, 500);
}

setTimeout(bloatWithMessages, 500);






