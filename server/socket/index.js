/**
 * Socket.io 处理器入口
 * 注册所有Socket事件处理器
 */

// 添加处理器导入
const handleLocationInteractions = require('./handlers/locationHandler');
const handleNPCInteractions = require('./handlers/npcHandler');
const handleRaftInteractions = require('./handlers/raftHandler');

/**
 * 设置Socket处理器
 * @param {Object} io - Socket.io实例
 * @param {Object} gameRooms - 游戏房间管理器
 * @param {Object} playerManager - 玩家管理器
 */
const setupSocketHandlers = (io, gameRooms, playerManager) => {
  io.on('connection', (socket) => {
    console.log(`玩家连接: ${socket.id}`);
    
    // 注册位置交互处理器
    handleLocationInteractions(io, socket, gameRooms, playerManager);
    
    // 注册NPC交互处理器
    handleNPCInteractions(io, socket, gameRooms, playerManager);
    
    // 注册木筏交互处理器
    handleRaftInteractions(io, socket, gameRooms, playerManager);
    
    // 断开连接处理
    socket.on('disconnect', () => {
      console.log(`玩家断开连接: ${socket.id}`);
      gameRooms.leaveRoom(socket.id);
    });
  });
};