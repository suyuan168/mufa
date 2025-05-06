require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize, testConnection } = require('./config/database');
const { syncUserModel } = require('./models/User');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io game logic
require('./socket')(io);

const PORT = process.env.PORT || 3000;

// 初始化数据库并启动服务器
const initializeServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    // 同步模型
    await syncUserModel();
    
    // 启动服务器
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (err) {
    console.error('服务器初始化失败:', err);
  }
};

// 启动服务器
initializeServer();

module.exports = { app, server, io }; 