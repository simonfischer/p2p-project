var http = require('http');
var https = require('https');


function requests (){
	function httpRequest(peer, link, content, callback, method, errorCallback, tries) {
	if(typeof tries == 'undefined'){
	  tries = 3;
	}
	var post_options = {
	      host : peer.ip,
	      port: peer.port,
	      path: link,
	      method: method,
	      headers: {
	          'content-type': 'application/json',
	      }
	};

	// perform request and handle response

	var post_req = http.request(post_options, function(res) {
	    var response = "";
	    res.on('data', function(chunk) {
	      response += chunk;
	    });

	    res.on('end', function() {
	      callback(response);
	      tries = -1;
	    });
	});
	post_req.write(JSON.stringify( content ));

	post_req.on('error', function(err) {
	  if(tries <= 0){
	     if(typeof errorCallback !== 'undefined'){ 
	        errorCallback();
	      }else{
	        console.log("Failed a http  " + method + " request on " + JSON.stringify(peer) + " with link: " + link);
	      }
	  }else{
	    httpRequest(peer, link, content, callback, method, errorCallback, (tries--));
	  }
	});

	post_req.end();
	}

	function postRequest(peer, link, content, callback, errorCallback) {
		httpRequest(peer, link, content, callback, "POST", errorCallback);
	}

	function getRequest(peer, link, callback, errorCallback, tries){
	 if(typeof tries == 'undefined'){
	  tries = 3;
	 }
	 var get_options = {
	    host : peer.ip,
	    port: peer.port,
	    path: link,
	    agent: false
	};
	http.get(get_options, function(res) {
	  var response = "";
	  res.on('data', function(chunk) {
	    response += chunk;
	  });

	  res.on('end', function() {
	    callback(response);
	  });
	}).on('error', function(err) {
	    if(tries <= 0){
	      if(typeof errorCallback !== 'undefined'){ 
	        errorCallback();
	      }else{

	        console.log("Failed a get request on " + JSON.stringify(peer) + " with link: " + link);
	      }
	    }else{
	      tries = tries - 1;

	      getRequest(peer, link, callback, errorCallback, tries);
	  }
	});
	}



	function deleteRequest(peer, link, callback, errorCallback) {
		httpRequest(peer, link, "", callback, "DELETE", errorCallback);
	}

	function putRequest(peer, link, content, callback, errorCallback) {
		httpRequest(peer, link, content, callback, "PUT", errorCallback);
	}

	return { deleteRequest : deleteRequest,
			 putRequest : putRequest,
			 getRequest : getRequest,
			 httpRequest : httpRequest,
			 postRequest : postRequest };
}
var requests = requests();
module.exports = requests;
