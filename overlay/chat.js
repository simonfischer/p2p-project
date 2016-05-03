function Chat(overlayNetwork) {
    _overlay = overlayNetwork;
    _chatMsgs = {}

    function sendMsg(groupName, msg, caller) {
        _overlay.multicast(groupName, msg, caller);
    }

    function join(groupName, caller) {
        function msgHandler(groupName, msg) {
            console.log("CHAT RECEIVED: " + msg);
            
            if (!_chatMsgs[groupName]) {
                _chatMsgs[groupName] = [];
            }            
            _chatMsgs[groupName].push(msg);

            // tell the HTML of the update somehow..
        }

        _overlay.join(groupName, caller, undefined, msgHandler);
    }

    function leave(groupName, caller) {
        _overlay.leave(groupName, caller);
    }

    function create(groupName) {
        var port = process.env.PORT;
        // Assuming always on localhost, this assumption comes from ./chord/peer.js line 467
        var groupName = "localhost:" + port + ";" + groupName;
        _overlay.create(groupName);
    }

    function handleCmd(type, content) {
        // switch on type, handle content depending on type
        // types define command task, ex. 'join' cmd from HTML
        switch(type) {
            case 'join':
                // grab groupname and caller from content
                // call join()
                break;
            case 'leave':
                // grab groupname and caller from content
                // call leave()
                break;
            case 'create':
                // grab groupname from content
                // call create()
                break;
            case 'sendmsg':
                // grab groupname, msg and caller from content
                // call sendMsg()
                break;
        }
    }

    return {}
}

module.exports = Chat;