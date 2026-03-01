const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    console.log('Подключился: ' + socket.id);
    
    players[socket.id] = {
        x: Math.random() * 600 + 50,
        y: Math.random() * 400 + 50,
        angle: 0,
        hp: 100,
        color: 'hsl(' + Math.random() * 360 + ', 70%, 50%)'
    };

    io.emit('updatePlayers', players);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    socket.on('shoot', () => {
        const p = players[socket.id];
        if (p && p.hp > 0) {
            console.log('Игрок ' + socket.id + ' выстрелил!'); 
            io.emit('bullet', {
                x: p.x + Math.cos(p.angle) * 25,
                y: p.y + Math.sin(p.angle) * 25,
                angle: p.angle,
                owner: socket.id
            });
        }
    });

    socket.on('hit', (targetId) => {
        if (players[targetId]) {
            players[targetId].hp -= 10;
            if (players[targetId].hp <= 0) {
                players[targetId].hp = 100;
                players[targetId].x = Math.random() * 600;
                players[targetId].y = Math.random() * 400;
            }
            io.emit('updatePlayers', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Сервер на порту ' + PORT));
