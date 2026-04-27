const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const stripeService = require('../services/stripeService');
const auditService = require('../services/auditService');

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });
        
        user = new User({ email, password });
        try {
            await user.save();
            
            // Create Stripe customer
            await stripeService.createCustomer(user._id, email);
        } catch (saveErr) {
            console.error('User save error:', saveErr);
            throw saveErr;
        }
        
        const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Log registration
        await auditService.logAuth(user._id, auditService.actions.REGISTER, { email }, req);
        
        res.status(201).json({ token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
        
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        
        const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Log login
        await auditService.logAuth(user._id, auditService.actions.LOGIN, { email }, req);
        
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

module.exports = router;
