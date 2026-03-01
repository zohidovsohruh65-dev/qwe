const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    players[socket.id] = {
        x: 300, y: 300,
        angle: 0, // Угол корпуса
        turretAngle: 0, // Угол пушки
        hp: 100,
        color: 'hsl(' + Math.random() * 360 + ', 80%, 50%)'
    };
    
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            players[socket.id].turretAngle = data.turretAngle;
            // Рассылаем экономно
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    socket.on('shoot', (data) => {
        io.emit('bullet', { x: data.x, y: data.y, angle: data.angle, owner: socket.id });
    });

    socket.on('hit', (id) => {
        if (players[id]) {
            players[id].hp -= 10;
            if (players[id].hp <= 0) { players[id].hp = 100; players[id].x = Math.random()*500; }
            io.emit('updatePlayers', players);
        }
    });

    socket.on('disconnect', () => { delete players[socket.id]; io.emit('updatePlayers', players); });
});

http.listen(process.env.PORT || 3000);
