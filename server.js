const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    // Начальные координаты — всегда числа!
    players[socket.id] = {
        x: 300, y: 300,
        angle: 0, turretAngle: 0,
        hp: 100,
        color: 'hsl(' + Math.random() * 360 + ', 80%, 50%)'
    };
    
    io.emit('updatePlayers', players);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            // Проверка на валидность данных, чтобы танк не исчезал
            players[socket.id].x = Number(data.x) || 300;
            players[socket.id].y = Number(data.y) || 300;
            players[socket.id].angle = Number(data.angle) || 0;
            players[socket.id].turretAngle = Number(data.turretAngle) || 0;
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    socket.on('shoot', (data) => {
        io.emit('bullet', { 
            x: Number(data.x), 
            y: Number(data.y), 
            angle: Number(data.angle), 
            owner: socket.id 
        });
    });

    socket.on('hit', (id) => {
        if (players[id]) {
            players[id].hp -= 10;
            if (players[id].hp <= 0) {
                players[id].hp = 100;
                players[id].x = Math.random() * 500 + 50;
                players[id].y = Math.random() * 500 + 50;
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
