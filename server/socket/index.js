// 添加新的处理器导入
const handleLocationInteractions = require('./handlers/locationHandler');
const handleNPCInteractions = require('./handlers/npcHandler');

// 在setupSocketHandlers函数中注册新的处理器
const setupSocketHandlers = (io, gameRooms, playerManager) => {
  // ... 现有代码 ...
  
  // 注册位置交互处理器
  handleLocationInteractions(io, socket, gameRooms, playerManager);
  
  // 注册NPC交互处理器
  handleNPCInteractions(io, socket, gameRooms, playerManager);
  
  // ... 现有代码 ...
}; 