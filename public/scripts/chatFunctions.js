var port = parseInt(window.location.port) + 1000
var socket = io.connect('http://localhost:' + port);

socket.on('newChatJoined', function(msg){
	var chats = msg.listOfChats;		
	$(".listOfChats").append('<div class="chatRoom">'+ msg.groupName +'</div>')
	createChat(msg.groupName);

});

socket.on('newChatMessage', function(msg){
	var chats = msg.listOfChats;		
	$('.chatContainer[id="'+msg.groupName+'"] .messageContainer')
			.append('<div class="message">'+ msg.msg +'</div>')
});





function createChat(groupName){
	var chatContainer = '<div class="chatContainer" id="'+ groupName +'">' +
		'<div class="messageContainer">'+
			
		'</div>'+

		'<div class="chatControls">'+
			'<form id="message'+ groupName + '">'+
				'<input type="hidden" name="groupName" value="'+groupName+'">'+
				'<input type="text" name="messageField" style="width: 80%">'+
		   		'<input type="submit" value="Send" style="width: 18%">'+
		    '</form>'+
		'</div>'+
	'</div>';

	$(".chatRooms").append(chatContainer);

	var id = '[id="message'+ groupName + '"]';
	console.log(id);
	$( id).submit(function( event ) {
	  var groupName= $(id + " :input")[0].value;
	  var msg= $(id + " :input")[1].value;
	  $(id + " :input")[1].value = "";
	  socket.emit('sendmsg', { msg : msg, groupName : groupName})
	  event.preventDefault();
	});
}




socket.on('initialChats', function(msg){
	var chats = msg.listOfChats;
	console.log("msg : " + msg);
	console.log(chats);
	for (i = 0; i < chats.length; i++){
		$(".listOfChats").append('<div class="chatRoom">'+ chats[i] +'</div>')
		createChat(chats[i]);
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
	});
	$(".listOfChats").on("click", ".chatRoom", function (event) {
		console.log(event.target.innerText)



		$(".fingerTable").hide();
		$(".groups").hide();
		$(".topics").hide();
		$(".successorList").hide();
	});
}