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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/users', userRoutes);

// Socket setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

        // 🔥 FIXED (important)
        io.in(roomId).emit('user-joined', socket.id, rooms[roomId]);

        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // WebRTC signaling
    socket.on('signal', (toId, message) => {
        io.to(toId).emit('signal', socket.id, message);
    });

    // Chat (room specific)
    socket.on('chat-message', (message, username) => {
        for (const roomId in rooms) {
            if (rooms[roomId].includes(socket.id)) {
                io.in(roomId).emit('chat-message', message, username, socket.id);
                break;
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        for (const roomId in rooms) {
            const index = rooms[roomId].indexOf(socket.id);

            if (index !== -1) {
                rooms[roomId].splice(index, 1);

                io.in(roomId).emit('user-left', socket.id);

                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                }

                break;
            }
        }
    });
});

// ENV
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

// Safety check
if (!MONGO_URI) {
    console.error("MONGO_URI not defined");
    process.exit(1);
}

// DB + server start
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB error:', err);
        process.exit(1);
    });