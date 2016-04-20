$( document ).ready(prepPage);


function prepPage(){
	$( "#join" ).submit(function( event ) {
	  var ip = $("#join :input")[0].value;
	  var port = $("#join :input")[1].value;
	  $.post( "http://"+ip+":"+port+"/peerRequests/join", function( data ) {});
	  event.preventDefault();
	});

	$("#stabilize").click(function(){
		$.post( "peerRequests/stabilize", function( data ) {});
	});

	$("#fixfingers").click(function(){
		$.post( "peerRequests/fixfingers", function( data ) {});
	});



	$( "#findID" ).submit(function( event ) {
	  var id = $("#findID :input")[0].value;
	  $.get( "peerRequests/find_successor/"+id, function( data ) {

	  	var text = createLink(data);
	  	$(".findIDResult").html(text)
	  });
	  event.preventDefault();
	});

	$( "#searchID" ).submit(function( event ) {
	  var id = $("#searchID :input")[0].value;
	  $.get( "peerRequests/find_resource/"+id, function( data ) {

	  	var text = createLink(data);
	  	$(".searchIDResult").html(text)
	  });
	  event.preventDefault();
	});



	$("#leave").click(function(){

		$.post( "peerRequests/leave", function( data ) {});
		$(".joinForm").removeClass("hidden");
		$(".leave").addClass("hidden");
	});

	setInterval(updatePeerData, 5000);

	
}
var testData = "teest";
function updatePeerData(){
	$.get( "peerRequests/successor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#succ .peerTitle").html(createLink(newData));
	});

	$.get( "peerRequests/predecessor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#pred .peerTitle").html(createLink(newData));
	});

	$.get("peerRequests/fingertable", function( newData ){

		newData = newData.fingerTable;

		var table = "<table>";
		table+="<h3>Hash table</h3>";
		table+= "<td>";
		table+= "FINGERID";
		table+="</td>";
		table+= "<td>";
		table+= "IP";
		table+="</td>";
		table+= "<td>";
		table+= "PORT";
		table+="</td>";
		table+= "<td>";
		table+= "ID";
		table+="</td>";


		for(i = 0; i < newData.length; i++){
			if(typeof(newData[i]) !== 'undefined' && newData[i] != null){
				table+= "<tr>";
				table+="<td>";
				table+= newData[i].fingerID;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].ip;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].port;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].id;
				table+= "</td>";
				table+="</tr>";
			}
		}

		table += "</table>";
		$(".fingerTable").html(table)	
	});

	
}

function createLink(data){
	 return '<a href="http://'+data.ip+':'+data.port+'">'+ data.id +'</a>';
}



