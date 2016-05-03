var socket = io.connect('http://localhost:5000');

socket.emit('chat message', { my: 'data' });
socket.on('chat message', function (data) {
    console.log(data);
});