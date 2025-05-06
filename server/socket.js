const jwt = require('jsonwebtoken');
const { User } = require('./models/User');
const RoomManager = require('./models/RoomManager');
const PlayerManager = require('./models/PlayerManager');
const handleLocationInteractions = require('./socket/handlers/locationHandler');
const handleNPCInteractions = require('./socket/handlers/npcHandler');

module.exports = (io) => {
  // 创建房间管理器
  const roomManager = new RoomManager(io);
  
  // 创建玩家管理器
  const playerManager = new PlayerManager();
  
  // 设置身份验证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('未授权'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      const user = await User.findByPk(decoded.id);
      
      if (!user) return next(new Error('用户不存在'));
      
      // 将用户信息存储在套接字对象中
      socket.user = {
        id: user.id,
        nickname: user.nickname,
        gameProgress: user.gameProgress
      };
      
      // 存储用户ID用于后续处理
      socket.userId = user.id;
      
      next();
    } catch (error) {
      console.error('Socket认证错误:', error);
      next(new Error('认证失败'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`玩家连接: ${socket.id}`);
    
    // 自动加入房间
    socket.on('room:join', async (data = {}) => {
      try {
        // 用户信息
        const playerData = {
          userId: socket.user.id,
          nickname: socket.user.nickname,
          gameProgress: socket.user.gameProgress
        };
        
        // 尝试加入房间
        const room = roomManager.joinRoom(socket.id, playerData, data.roomId);
        
        if (room) {
          // 加入Socket.io房间
          socket.join(room.id);
          
          // 发送初始游戏状态
          socket.emit('game:init', {
            roomId: room.id,
            player: playerData,
            resources: room.resources,
            sharks: Array.from(room.sharks.values()).map(shark => shark.getClientData()),
            locations: Array.from(room.locations.values()).map(location => location.getClientData()),
            npcs: Array.from(room.npcs.values()).map(npc => npc.getClientData()),
            players: room.getActivePlayers(),
            weather: room.weather.getWeatherState()
          });
          
          // 通知房间其他玩家有新玩家加入
          socket.to(room.id).emit('player:joined', {
            socketId: socket.id,
            nickname: playerData.nickname,
            raftSize: playerData.gameProgress.raftSize
          });
          
          console.log(`玩家 ${playerData.nickname} 加入房间 ${room.id}`);
        } else {
          socket.emit('room:error', { message: '无法加入房间' });
        }
      } catch (error) {
        console.error('加入房间错误:', error);
        socket.emit('room:error', { message: '加入房间时发生错误' });
      }
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      console.log(`玩家断开连接: ${socket.id}`);
      
      // 从房间中移除玩家
      roomManager.leaveRoom(socket.id);
    });
    
    // 玩家移动
    socket.on('player:move', (position) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;
      
      // 更新玩家位置
      room.updatePlayerPosition(socket.id, position);
      
      // 广播位置（游戏状态已经在GameRoom类的update中广播）
    });
    
    // 玩家使用钩子
    socket.on('hook:use', (data) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;
      
      // 广播钩子使用事件
      socket.to(room.id).emit('hook:used', {
        playerId: socket.id,
        direction: data.direction,
        position: data.position
      });
    });
    
    // 玩家收集资源
    socket.on('resource:collect', (resourceId) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;
      
      // 处理资源收集
      const resource = room.onResourceCollected(socket.id, resourceId);
      
      if (resource) {
        // 更新玩家游戏进度
        updatePlayerResource(socket.user.id, resource.type, 1);
        
        // 通知玩家资源已收集
        socket.emit('resource:collected:success', {
          type: resource.type,
          resourceId: resourceId
        });
      }
    });
    
    // 注册位置交互处理器
    handleLocationInteractions(io, socket, roomManager, playerManager);
    
    // 注册NPC交互处理器
    handleNPCInteractions(io, socket, roomManager, playerManager);
    
    // 玩家库存更新 (由客户端发起的同步)
    socket.on('player:inventory_update', (data) => {
      try {
        if (!data.inventory) return;
        
        // 更新玩家游戏进度
        if (socket.user && socket.userId) {
          playerManager.getPlayerById(socket.userId)
            .then(player => {
              if (player) {
                player.gameProgress.inventory = data.inventory;
                playerManager.savePlayerProgress(socket.userId, player.gameProgress);
              }
            })
            .catch(err => console.error('更新玩家库存错误:', err));
        }
      } catch (error) {
        console.error('处理库存更新错误:', error);
      }
    });
    
    // 玩家制作物品
    socket.on('craft:item', async (itemData) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) {
        return socket.emit('craft:failed', { message: '未加入游戏房间' });
      }
      
      try {
        const itemType = itemData.type;
        
        if (!itemType) {
          return socket.emit('craft:failed', { message: '物品类型无效' });
        }
        
        // 从数据库获取最新的玩家数据
        const user = await User.findByPk(socket.user.id);
        if (!user) {
          return socket.emit('craft:failed', { message: '用户数据不存在' });
        }
        
        // 获取游戏进度数据
        const gameProgress = user.gameProgress || {};
        
        // 确保资源字段存在
        if (!gameProgress.resources) {
          gameProgress.resources = {};
        }
        
        // 确保物品字段存在
        if (!gameProgress.items) {
          gameProgress.items = [];
        }
        
        // 检查玩家是否已经有此物品
        if (itemType === 'raft_upgrade') {
          // 木筏升级是特例，可以多次制作
          if (!gameProgress.raftSize) {
            gameProgress.raftSize = 1;
          }
        } else {
          // 其他物品检查是否已拥有
          const hasItem = gameProgress.items.includes(itemType);
          if (hasItem) {
            return socket.emit('craft:failed', { message: '你已拥有此物品' });
          }
        }
        
        // 检查制作所需资源
        const requiredResources = getItemCost(itemType);
        if (!requiredResources) {
          return socket.emit('craft:failed', { message: '未知物品类型' });
        }
        
        // 检查资源是否足够
        for (const [resource, amount] of Object.entries(requiredResources)) {
          const playerAmount = gameProgress.resources[resource] || 0;
          if (playerAmount < amount) {
            return socket.emit('craft:failed', { message: `资源不足: 需要 ${amount} 个 ${resource}` });
          }
        }
        
        // 扣除资源
        for (const [resource, amount] of Object.entries(requiredResources)) {
          gameProgress.resources[resource] -= amount;
        }
        
        // 制作物品
        if (itemType === 'raft_upgrade') {
          // 木筏升级处理
          gameProgress.raftSize += 1;
          
          // 广播木筏升级事件
          io.to(room.id).emit('player:raft_upgraded', {
            playerId: socket.id,
            newSize: gameProgress.raftSize
          });
        } else {
          // 添加物品到玩家库存
          gameProgress.items.push(itemType);
        }
        
        // 保存游戏进度
        user.gameProgress = gameProgress;
        await user.save();
        
        // 更新套接字中的用户数据
        socket.user.gameProgress = gameProgress;
        
        // 通知客户端制作成功
        socket.emit('craft:success', {
          itemType,
          gameProgress
        });
      } catch (error) {
        console.error('制作物品错误:', error);
        socket.emit('craft:failed', { message: '服务器错误' });
      }
    });
    
    // 玩家攻击鲨鱼
    socket.on('shark:attack', (data) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;
      
      const { sharkId, damage = 10 } = data;
      
      // 处理攻击
      const success = room.onPlayerAttackShark(socket.id, sharkId, damage);
      
      if (!success) {
        socket.emit('shark:attack:failed', { message: '鲨鱼不存在或已死亡' });
      }
    });
    
    // 玩家聊天
    socket.on('chat:message', (message) => {
      const room = roomManager.getPlayerRoom(socket.id);
      if (!room) return;
      
      // 基本过滤敏感内容（实际应用中需要更完善的过滤机制）
      const filteredMessage = message.replace(/[<>]/g, '').trim();
      
      if (filteredMessage.length === 0 || filteredMessage.length > 100) {
        return; // 忽略空消息或过长消息
      }
      
      // 广播聊天消息
      io.to(room.id).emit('chat:message', {
        playerId: socket.id,
        playerName: socket.user.nickname,
        message: filteredMessage,
        timestamp: Date.now()
      });
    });
    
    // 获取房间列表（用于调试或自定义房间功能）
    socket.on('rooms:list', () => {
      const rooms = roomManager.getAllRooms();
      socket.emit('rooms:list', rooms);
    });
  });
  
  // 辅助函数：更新玩家资源
  const updatePlayerResource = async (userId, resourceType, amount) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) return false;
      
      // 获取游戏进度数据
      const gameProgress = user.gameProgress || {};
      
      // 确保资源字段存在
      if (!gameProgress.resources) {
        gameProgress.resources = {};
      }
      
      // 更新资源
      if (!gameProgress.resources[resourceType]) {
        gameProgress.resources[resourceType] = 0;
      }
      gameProgress.resources[resourceType] += amount;
      
      // 保存游戏进度
      user.gameProgress = gameProgress;
      await user.save();
      
      return true;
    } catch (error) {
      console.error('更新玩家资源错误:', error);
      return false;
    }
  };
  
  // 辅助函数：获取物品制作所需资源
  const getItemCost = (itemType) => {
    const costs = {
      'raft_upgrade': { wood: 10, plastic: 5 },
      'fishing_rod': { wood: 4, plastic: 2 },
      'spear': { wood: 3, metal: 2 },
      'water_purifier': { plastic: 6, metal: 4 },
      'grill': { metal: 5, wood: 3 },
      'metal_spear': { metal: 8 }
    };
    
    return costs[itemType];
  };
}; 