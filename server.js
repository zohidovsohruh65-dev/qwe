const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Указываем серверу, что папка с файлами — текущая
app.use(express.static(__dirname));

// При заходе на главную (/) — отдаем index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let players = {};

io.on('connection', (socket) => {
    console.log('Игрок вошел: ' + socket.id);
    
    // Создаем танк в случайном месте
    players[socket.id] = {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        angle: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    io.emit('updatePlayers', players);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            // Рассылаем всем, кроме отправителя (для экономии трафика)
            socket.broadcast.emit('updatePlayers', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

// Запуск на порту 3000
http.listen(3000, () => {
    console.log('--- СЕРВЕР ЗАПУЩЕН ---');
    console.log('Открой: http://localhost:3000');
});