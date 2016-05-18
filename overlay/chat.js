function Chat(overlayNetwork) {
    var _overlay = overlayNetwork;
    var _chatMsgs = {}
    var _io;
    var caller = { ip : "localhost", port : process.env.PORT }


    function sendMsg(groupName, msg) {
        _overlay.multicast(groupName, msg, undefined, caller);
    }

    function join(groupName) {
        
        _overlay.join(groupName, caller, function(){}, msgHandler);
        _io.emit("newChatJoined", {groupName : groupName});
    }
    function setIo(io){
        _io = io;
    }

    function getChats(){
        var topics  = _overlay.topics;
        var chats = [];
        for (var key in topics) {
            var chat = {groupName : key}
            chat.messages = _chatMsgs[key];

            chats.push(chat);

        }

        return chats; 
    }

    function msgHandler(groupName, msg) {

        _io.emit("newChatMessage", {groupName : groupName, msg : msg});
        if (!_chatMsgs[groupName]) {
            _chatMsgs[groupName] = [];
        }            
        _chatMsgs[groupName].push(msg);

        // tell the HTML of the update somehow..
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

    function sendChildNodes(msg, socket){
        var children = _overlay.getChildren(msg.groupName);
        var topics = _overlay.topics;
        var interested = false;
        if(typeof topics[msg.groupName] != 'undefined'){
            interested = true;
        }
        
        socket.emit("childrenNodes", {groupName : msg.groupName, children : children, thisPeer : _overlay.get_this(), level : msg.level, interested : interested });
    }

    function handleCmd(type, content, socket) {
        // switch on type, handle content depending on type
        // types define command task, ex. 'join' cmd from HTML
        switch(type) {
            case 'join':
                // grab groupname and caller from content
                // call join()
                join(content.groupName)
                break;
            case 'leave':
                // grab groupname and caller from content
                // call leave()
                break;
            case 'create':
                // grab groupname from content
                // call create()
                create(content.groupName);
                break;
            case 'sendmsg':
                // grab groupname, msg and caller from content
                // call sendMsg()
                sendMsg(content.groupName, content.msg)
                break;
            case 'childNodes':
                sendChildNodes(content, socket);
                break;
        }
    }

    return { handleCmd : handleCmd,
             setIo : setIo,
             getChats : getChats}
}

module.exports = Chat;