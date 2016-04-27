var assert = require('chai').assert;
var sinon = require('sinon');
var peer = require('../chord/peer');
var requests = require('../utils/httpRequests');

var peerMock;
var requestsMock;

var multicast;



describe("Create group", function(){
	beforeEach("Run this before", function(){
		console.log("before");
		peerMock = sinon.mock(peer);
		requestsMock = sinon.mock(requests);
		multicast = require('../overlay/chatOverlay')(peer, requests);
	});

	it("Groupname is correctly created ", function(){

		peerMock.expects("get_this").once().returns({ip : "ip", port : "port"});



		peerMock.expects("find_successor").once()
		
		requestsMock.expects("postRequest")

		multicast.createGroupByName("test");

		peerMock.verify();
		requestsMock.verify();



	});

})


