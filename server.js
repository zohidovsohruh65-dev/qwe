const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    interpolation: true // Включаем мягкую передачу
});

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    players[socket.id] = {
        x: 300, y: 300, angle: 0, turretAngle: 0, hp: 100,
        color: 'hsl(' + Math.random() * 360 + ', 80%, 50%)'
    };
    
    socket.on('move', (data) => {
        if (players[socket.id]) {
            Object.assign(players[socket.id], data);
            socket.broadcast.emit('moveUpdate', { id: socket.id, ...data });
        }
    });

    socket.on('shoot', (data) => {
        // Сервер просто транслирует выстрел остальным
        socket.broadcast.emit('bullet', data);
    });

    socket.on('hit', (id) => {
        if (players[id]) {
            players[id].hp -= 10;
            if (players[id].hp <= 0) { players[id].hp = 100; players[id].x = Math.random()*500; }
            io.emit('updateHP', { id: id, hp: players[id].hp, x: players[id].x, y: players[id].y });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });
});

http.listen(process.env.PORT || 3000);
