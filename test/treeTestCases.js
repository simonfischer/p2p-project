var assert = require('chai').assert;
var sinon = require('sinon');
var peer;
var requests;

var peerMock;
var requestsMock;
var multicastMock;

var multicast;



describe("Create group", function(){
	beforeEach("Run this before", function(){
		peer = require('../chord/peer');
		requests = require('../utils/httpRequests');

		multicast = require('../overlay/chatOverlay')(peer, requests);

		peerMock = sinon.mock(peer);
		requestsMock = sinon.mock(requests);
	});


	it("Groupname is correctly created ", function(){

		peerMock.expects("get_this").once().returns({ip : "192.168.1.1", port : "2000"});
		
		multicastMock = sinon.mock(multicast)
		
		multicastMock.expects("create").once().withArgs("192.168.1.1:2000;group")

		multicast.createGroupByName("group")

		multicastMock.verify()

		// var groupCreated = false;
		// multicast.create = function(name){
		// 	console.log("ceate");
		// 	if(name == "192.168.1.1:2000;group"){
		// 		groupCreated = true;
		// 	}
		// }

		// multicast.createGroupByName("group");

		// assert(groupCreated);

	});

	/*it("Groupname is correctly created ", function(){

		peerMock.expects("get_this").once().returns({ip : "192.168.1.1", port : "2000"});

		peer.find_successor = function(var1, callback){
			callback({ip : "192.168.1.2", port : "2002"});
		}
		requestsMock.expects("postRequest").withArgs({ip : "192.168.1.2", port : "2002"}, "/chat/192.168.1.1:2000;group/create")

		multicast.createGroupByName("group");

		peerMock.verify();
		requestsMock.verify();
	});*/



})


