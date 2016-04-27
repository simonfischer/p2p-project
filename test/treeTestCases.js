var assert = require('chai').assert;
var sinon = require('sinon');
var peer;
var requests;

var peerMock;
var requestsMock;

var multicast;



describe("Create group", function(){
	beforeEach("Run this before", function(){
		peer = require('../chord/peer');
		requests = require('../utils/httpRequests');
		peerMock = sinon.mock(peer);
		requestsMock = sinon.mock(requests);
		multicast = require('../overlay/chatOverlay')(peer, requests);
	});

	it("Groupname is correctly created ", function(){

		peerMock.expects("get_this").once().returns({ip : "192.168.1.1", port : "2000"});

		peer.find_successor = function(var1, callback){
			callback({ip : "192.168.1.2", port : "2002"});
		}
		requestsMock.expects("postRequest").withArgs({ip : "192.168.1.2", port : "2002"}, "/chat/192.168.1.1:2000;group/create")

		multicast.createGroupByName("group");

		peerMock.verify();
		requestsMock.verify();
	});

	

})


