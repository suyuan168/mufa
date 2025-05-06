const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { sequelize } = require('../config/database');
const router = express.Router();

// Middleware to authenticate user
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: '无令牌，授权被拒绝' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: '令牌无效' });
  }
};

// Get game progress
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    res.json(req.user.gameProgress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

// Save game progress
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { resources, raftSize, items, level } = req.body;
    
    // Update user's game progress
    const gameProgress = {
      ...req.user.gameProgress,
      resources: resources || req.user.gameProgress.resources,
      raftSize: raftSize || req.user.gameProgress.raftSize,
      items: items || req.user.gameProgress.items,
      level: level || req.user.gameProgress.level,
      lastSaved: new Date()
    };
    
    // 更新用户游戏进度
    await req.user.update({ gameProgress });
    
    res.json({ message: '游戏进度已保存', gameProgress: req.user.gameProgress });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.findAll({
      attributes: ['nickname', 'gameProgress'],
      order: [
        [sequelize.literal('gameProgress->level'), 'DESC'],
        [sequelize.literal('gameProgress->raftSize'), 'DESC']
      ],
      limit: 10
    });
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

module.exports = router; 