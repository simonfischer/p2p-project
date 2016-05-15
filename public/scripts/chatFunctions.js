var port = parseInt(window.location.port) + 1000
var socket = io.connect('http://localhost:' + port);

socket.on('newChatJoined', function(msg){
	var chats = msg.listOfChats;		
	$(".listOfChats").append('<div class="chatRoom">'+ msg.groupName +'</div>')
	$(".listOfChats").append('<div class="chatRoom">network'+ msg.groupName +'</div>')
	createChat(msg.groupName);

});

socket.on('newChatMessage', function(msg){
	var chats = msg.listOfChats;		
	var containerId = '.chatContainer[id="'+msg.groupName+'"] .messageContainer';
	$(containerId).append('<div class="message">'+ msg.msg +'</div>')
	$(containerId).scrollTop($(containerId)[0].scrollHeight);
});

socket.on('childrenNodes', handleChildrenNodes);

var sockets = {};

function handleChildrenNodes(msg){
	var children = msg.children;
	var thisPeer = msg.thisPeer;
	var groupName = msg.groupName;
	for(i = 0; i < children.length; i++){
		var port = (parseInt(children[i].port)+1000);
		nodes[groupName].add({id : (parseInt(children[i].port)+1000), label : children[i].id, level : msg.level})
		edges[groupName].add({from : (thisPeer.port + 1000), to: (parseInt(children[i].port)+1000)})

		var socketName = groupName + "" + port;

		if(typeof sockets[socketName] == 'undefined'){
			sockets[socketName] = io.connect('http://localhost:' + port);
			sockets[socketName].on('childrenNodes', handleChildrenNodes);
		}
		var newLevel = msg.level + 1;


		sockets[socketName].emit('childNodes', { groupName : msg.groupName, level : newLevel})
		
		
	}
}

function createNetworkGraph(groupName){
	nodes[groupName].add({id : port, label : port, level : 0})
	socket.emit('childNodes', { groupName : groupName, level : 1})
}

function createChat(groupName){
	var chatContainer = '<div class="chatContainer" style="display: none;" id="'+ groupName +'">' +
		'<div class="messageContainer">'+
			
		'</div>'+

		'<div class="chatControls">'+
			'<form id="message'+ groupName + '">'+
				'<input type="hidden" name="groupName" value="'+groupName+'">'+
				'<input type="text" name="messageField" style="width: 80%">'+
		   		'<input type="submit" value="Send" style="width: 18%">'+
		    '</form>'+
		'</div>'+
	'</div>' +
	'<div class="chatContainer" id="network'+ groupName + '" style="display: none; height: 90%; width: 800px;"></div>';

	$(".chatRooms").append(chatContainer);

	var id = '[id="message'+ groupName + '"]';

	$( id).submit(function( event ) {
	  var groupName= $(id + " :input")[0].value;
	  var msg= $(id + " :input")[1].value;
	  $(id + " :input")[1].value = "";
	  socket.emit('sendmsg', { msg : msg, groupName : groupName})
	  event.preventDefault();
	});
	createNetwork(groupName);
}




socket.on('initialChats', function(msg){
	var chats = msg.listOfChats;
	console.log("chats: " + chats.length)
	for (i = 0; i < chats.length; i++){
		console.log("chat groupname: " + chats[i].groupName)
		$(".listOfChats").append('<div class="chatRoom">'+ chats[i].groupName +'</div>')

		$(".listOfChats").append('<div class="chatRoom">network'+ chats[i].groupName +'</div>')
		var chatMessages = chats[i].messages;
		createChat(chats[i].groupName);

		if(typeof chatMessages == 'undefined'){
			continue;
		}
		var containerId = '.chatContainer[id="'+chats[i].groupName+'"] .messageContainer';
		for(j = 0; j < chatMessages.length; j++){
			$(containerId)
			.append('<div class="message">'+ chatMessages[j]+'</div>')
		}


	}
});

$( document ).ready(prepPageForChat);


function prepPageForChat(){
	$( "#createNewGroupForm" ).submit(function( event ) {
	  var groupName = $("#createNewGroupForm :input")[0].value;
	  $("#createNewGroupForm :input")[0].value = "";
	  socket.emit('create', { groupName : groupName})
	  event.preventDefault();
	});

	$( "#joinNewGroupForm" ).submit(function( event ) {
	  var groupName = $("#joinNewGroupForm :input")[0].value;
	  $("#joinNewGroupForm :input")[0].value = "";
	  socket.emit('join', { groupName : groupName})
	  event.preventDefault();
	});



	$(".settings").click(function(){
		$(".fingerTable").show();

		$(".groups").show();

		$(".topics").show();

		$(".successorList").show();

		var chatRooms = $(".chatRooms").children();

		for(i = 0; i < chatRooms.length; i++){
			$(chatRooms[i]).hide()
		}
	});
	$(".listOfChats").on("click", ".chatRoom", function (event) {
		var groupName = event.target.innerText;

		var chatRooms = $(".chatRooms").children();

		for(i = 0; i < chatRooms.length; i++){
			$(chatRooms[i]).hide()
		}
		$('.chatContainer[id="'+groupName+'"]').show()
		
		for (var key in network){
			network[key].fit()
		}

		var containerId = '.chatContainer[id="'+groupName+'"] .messageContainer';
		
		$(".fingerTable").hide();
		$(".groups").hide();
		$(".topics").hide();
		$(".successorList").hide();
		$(containerId).scrollTop($(containerId)[0].scrollHeight);


		
	});
}





var nodes = {};
var edges = {};
var network = {};



function createNetwork(groupName){
	// create an array with nodes
	nodes[groupName] = new vis.DataSet([]);

	// create an array with edges
	edges[groupName] = new vis.DataSet([]);



	// create a network
	var container = document.getElementById('network'+groupName);
	var data = {
	nodes: nodes[groupName],
	edges: edges[groupName]
	};
	var options = {
		autoResize: true,
		height: '100%',
 		width: '100%',
 		/*physics: {
            enabled: false
        },*/
 		//interaction: {dragNodes :false},

		layout : {
			hierarchical : {
				direction: "UD"
			}
		}
	};

	network[groupName] = new vis.Network(container, data, options);

	network[groupName].on("selectNode", function(params){
		socket.emit('forceQuitNode', {node : (parseInt(params.nodes[0])-1000) })

	});


	createNetworkGraph(groupName)
}
