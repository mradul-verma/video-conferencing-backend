require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/video-conferencing';

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await User.countDocuments();
        console.log(`Total users in database: ${count}`);

        if (count === 0) {
            console.log('No users found. Create a user via the frontend or API.');
        } else {
            const users = await User.find({}, 'name username');
            console.log('Users:', users);
        }

        console.log('\nDatabase setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Database error:', error.message);
        process.exit(1);
    }
};

seedDatabase();