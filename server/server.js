const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const clients = [];

server.on('connection', socket => {
    clients.push(socket);

    socket.on('message', message => {
        clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on('close', () => {
        clients.splice(clients.indexOf(socket), 1);
    });
});
