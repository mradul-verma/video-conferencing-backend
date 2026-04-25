const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.query.token || req.body.token;
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/get_all_activity', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ activity: user.activity });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity', error: error.message });
    }
});

router.post('/add_to_activity', authenticateToken, async (req, res) => {
    try {
        const { meeting_code } = req.body;
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.activity.push({ meeting_code });
        await user.save();

        res.status(200).json({ message: 'Activity added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding activity', error: error.message });
    }
});

module.exports = router;