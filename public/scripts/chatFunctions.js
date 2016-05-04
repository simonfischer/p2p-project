var port = parseInt(window.location.port) + 1000
var socket = io.connect('http://localhost:' + port);

socket.on('newChatJoined', function(msg){
	var chats = msg.listOfChats;		
	$(".listOfChats").append('<div class="chatRoom">'+ msg.groupName +'</div>')
	createChat(msg.groupName);

});

socket.on('newChatMessage', function(msg){
	var chats = msg.listOfChats;		
	var containerId = '.chatContainer[id="'+msg.groupName+'"] .messageContainer';
	$(containerId).append('<div class="message">'+ msg.msg +'</div>')
	$(containerId).scrollTop($(containerId)[0].scrollHeight);
});





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
	'</div>';

	$(".chatRooms").append(chatContainer);

	var id = '[id="message'+ groupName + '"]';

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
	for (i = 0; i < chats.length; i++){

		$(".listOfChats").append('<div class="chatRoom">'+ chats[i].groupName +'</div>')
		var chatMessages = chats[i].messages;
		createChat(chats[i].groupName);

		if(typeof chatMessages == 'undefined'){
			return;
		}
		var containerId = '.chatContainer[id="'+chats[i].groupName+'"] .messageContainer';
		for(j = 0; j < chatMessages.length; j++){
			$(containerId)
			.append('<div class="message">'+ chatMessages[j]+'</div>')
		}
		console.log("scroll to top")


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
		
		var containerId = '.chatContainer[id="'+groupName+'"] .messageContainer';
		$(containerId).scrollTop($(containerId)[0].scrollHeight);


		$(".fingerTable").hide();
		$(".groups").hide();
		$(".topics").hide();
		$(".successorList").hide();
	});
}