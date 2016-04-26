var assert = require('chai').assert;

var _chordring = {};

var multicast = {};


beforeEach(function(){
	_chordring = {};
	multicast = require('../overlay/chatOverlay')(_chordring);
});



