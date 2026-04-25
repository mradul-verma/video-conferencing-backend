require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use('/api/v1/users', authRoutes);
app.use('/api/v1/users', userRoutes);

let rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-call', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        
        if (!rooms[roomId].includes(socket.id)) {
            rooms[roomId].push(socket.id);
        }

        socket.join(roomId);
        
        socket.to(roomId).emit('user-joined', socket.id, rooms[roomId]);
        
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('signal', (toId, message) => {
        socket.to(toId).emit('signal', socket.id, message);
    });

    socket.on('chat-message', (message, username) => {
        socket.broadcast.emit('chat-message', message, username, socket.id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        for (const roomId in rooms) {
            const index = rooms[roomId].indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].splice(index, 1);
                socket.to(roomId).emit('user-left', socket.id);
                
                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/video-conferencing';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => console.error('MongoDB connection error:', err));