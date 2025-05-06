/**
 * NPC交互处理器
 * 处理玩家与商人、海盗等NPC的交互
 */
const handleNPCInteractions = (io, socket, gameRooms, playerManager) => {
  // 玩家与NPC互动
  socket.on('npc:interact', (data, callback) => {
    try {
      const { npcId } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 调用游戏房间的NPC互动方法
      const result = room.onPlayerInteractWithNPC(socket.id, npcId);
      
      // 返回互动结果
      callback(result);
    } catch (error) {
      console.error('NPC互动错误:', error);
      callback({ success: false, message: '处理互动时出错' });
    }
  });
  
  // 玩家与商人交易
  socket.on('npc:trade', (data, callback) => {
    try {
      const { npcId, itemIndex, quantity } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 调用游戏房间的NPC交易方法
      const result = room.onPlayerTradeWithNPC(socket.id, npcId, itemIndex, quantity);
      
      // 返回交易结果
      callback(result);
      
      // 如果交易成功，更新玩家进度
      if (result.success && result.item) {
        // 获取玩家数据
        const player = playerManager.getPlayerById(socket.userId);
        if (player) {
          // 更新玩家库存 (添加购买的物品)
          const itemType = result.item.type;
          const amount = result.item.quantity || 1;
          
          if (!player.gameProgress.inventory[itemType]) {
            player.gameProgress.inventory[itemType] = 0;
          }
          player.gameProgress.inventory[itemType] += amount;
          
          // 减少玩家支付的货币
          const currency = result.item.price;
          const currencyType = room.npcs.get(npcId).currencyType || 'metal';
          
          if (!player.gameProgress.inventory[currencyType]) {
            player.gameProgress.inventory[currencyType] = 0;
          }
          player.gameProgress.inventory[currencyType] = Math.max(0, player.gameProgress.inventory[currencyType] - currency);
          
          // 保存玩家数据
          playerManager.savePlayerProgress(socket.userId, player.gameProgress);
        }
      }
    } catch (error) {
      console.error('NPC交易错误:', error);
      callback({ success: false, message: '处理交易时出错' });
    }
  });
  
  // 玩家攻击海盗
  socket.on('pirate:attack', (data, callback) => {
    try {
      const { pirateId, damage } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 调用游戏房间的攻击海盗方法
      const result = room.onPlayerAttackPirate(socket.id, pirateId, damage);
      
      // 返回攻击结果
      callback(result);
      
      // 如果海盗被击败并掉落战利品，更新玩家进度
      if (result.success && result.loot) {
        // 获取玩家数据
        const player = playerManager.getPlayerById(socket.userId);
        if (player) {
          // 更新玩家库存
          for (const item of result.loot) {
            if (!player.gameProgress.inventory[item.type]) {
              player.gameProgress.inventory[item.type] = 0;
            }
            player.gameProgress.inventory[item.type] += item.amount;
          }
          
          // 保存玩家数据
          playerManager.savePlayerProgress(socket.userId, player.gameProgress);
        }
      }
    } catch (error) {
      console.error('攻击海盗错误:', error);
      callback({ success: false, message: '处理攻击时出错' });
    }
  });
  
  // 玩家贿赂海盗
  socket.on('pirate:bribe', (data, callback) => {
    try {
      const { pirateId, resourceType, amount } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 获取玩家数据
      const player = playerManager.getPlayerById(socket.userId);
      if (!player) {
        return callback({ success: false, message: '未找到玩家数据' });
      }
      
      // 检查玩家是否有足够的资源
      if (!player.gameProgress.inventory[resourceType] || player.gameProgress.inventory[resourceType] < amount) {
        return callback({ success: false, message: '资源不足，无法贿赂' });
      }
      
      // 获取海盗NPC
      const pirate = room.npcs.get(pirateId);
      if (!pirate || pirate.type !== 'pirate') {
        return callback({ success: false, message: '目标不是海盗' });
      }
      
      // 尝试贿赂海盗
      const result = pirate.bribePirate(room.players.get(socket.id), resourceType, amount);
      
      // 如果贿赂成功，扣除玩家资源
      if (result.success) {
        player.gameProgress.inventory[resourceType] -= amount;
        playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      }
      
      // 返回贿赂结果
      callback(result);
    } catch (error) {
      console.error('贿赂海盗错误:', error);
      callback({ success: false, message: '处理贿赂时出错' });
    }
  });
};

module.exports = handleNPCInteractions; 