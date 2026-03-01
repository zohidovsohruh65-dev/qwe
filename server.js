const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    players[socket.id] = {
        x: Math.random() * 500 + 50,
        y: Math.random() * 400 + 50,
        angle: 0,
        hp: 100,
        color: 'hsl(' + Math.random() * 360 + ', 80%, 50%)'
    };
    io.emit('updatePlayers', players);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            // Передаем всем остальным, чтобы не было дерготни у себя
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    socket.on('shoot', (data) => {
        const p = players[socket.id];
        if (p && p.hp > 0) {
            io.emit('bullet', {
                x: p.x + Math.cos(data.angle) * 30,
                y: p.y + Math.sin(data.angle) * 30,
                angle: data.angle,
                owner: socket.id
            });
        }
    });

    socket.on('hit', (targetId) => {
        if (players[targetId]) {
            players[targetId].hp -= 10;
            if (players[targetId].hp <= 0) {
                players[targetId].hp = 100;
                players[targetId].x = Math.random() * 800;
                players[targetId].y = Math.random() * 600;
            }
            io.emit('updatePlayers', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

http.listen(process.env.PORT || 3000);
