/**
 * 位置交互处理器
 * 处理玩家与岛屿、沉船等位置的交互
 */
const handleLocationInteractions = (io, socket, gameRooms, playerManager) => {
  // 玩家与位置互动
  socket.on('location:interact', (data, callback) => {
    try {
      const { locationId } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 调用游戏房间的位置互动方法
      const result = room.onPlayerInteractWithLocation(socket.id, locationId);
      
      // 返回互动结果
      callback(result);
      
      // 如果互动成功且包含资源，更新玩家进度
      if (result.success && result.loot && result.loot.length > 0) {
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
          
          // 如果是任务物品，可能触发任务进度更新
          const questItems = result.loot.filter(item => item.questItem);
          if (questItems.length > 0) {
            // 这里可以处理任务相关逻辑
            // ...
          }
        }
      }
    } catch (error) {
      console.error('位置互动错误:', error);
      callback({ success: false, message: '处理互动时出错' });
    }
  });
  
  // 玩家解谜
  socket.on('location:solve_puzzle', (data, callback) => {
    try {
      const { locationId, solution } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 获取位置
      const location = room.locations.get(locationId);
      if (!location) {
        return callback({ success: false, message: '位置不存在' });
      }
      
      // 尝试解谜
      const result = location.attemptPuzzle(socket.id, solution);
      
      // 返回解谜结果
      callback(result);
      
      // 如果解谜成功，广播通知
      if (result.success) {
        const player = room.players.get(socket.id);
        room.io.to(room.id).emit('puzzle:solved', {
          locationId,
          playerId: socket.id,
          playerName: player.nickname
        });
      }
    } catch (error) {
      console.error('解谜错误:', error);
      callback({ success: false, message: '处理解谜时出错' });
    }
  });
};

module.exports = handleLocationInteractions; 