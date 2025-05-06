const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const router = express.Router();

// Phone number validation helper
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{11}$/; // Assumes Chinese phone numbers with 11 digits
  return phoneRegex.test(phoneNumber);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { phone_number, password, nickname, username } = req.body;
    
    // Validate fields
    if (!phone_number || !password || !nickname) {
      return res.status(400).json({ message: '手机号、密码和昵称都是必填项' });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone_number)) {
      return res.status(400).json({ message: '请输入有效的手机号' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser) {
      return res.status(400).json({ message: '该手机号已被注册' });
    }

    // Create new user
    const newUser = await User.create({
      phone_number,
      password,
      nickname,
      username: username || phone_number // 使用手机号作为默认用户名
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        phone_number: newUser.phone_number,
        nickname: newUser.nickname,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // 允许使用手机号或用户名登录
    const { phone_number, username, password } = req.body;
    
    // 验证参数
    if ((!phone_number && !username) || !password) {
      return res.status(400).json({ message: '请提供手机号或用户名，以及密码' });
    }

    // 查找用户 - 先尝试用手机号
    let user = null;
    if (phone_number) {
      user = await User.findOne({ where: { phone_number } });
    }
    
    // 如果没找到，尝试用用户名
    if (!user && username) {
      user = await User.findOne({ where: { username } });
    }
    
    if (!user) {
      return res.status(400).json({ message: '该账号未注册' });
    }

    // 检查密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        username: user.username,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

// Get current user
router.get('/user', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: '无令牌，授权被拒绝' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

module.exports = router; 