/**
 * 木筏交互处理器
 * 处理玩家与木筏建造、升级和资源收集相关的交互
 */
const RaftBuilder = require('../../models/RaftBuilder');
const ResourceManager = require('../../models/ResourceManager');
const SurvivalSystem = require('../../models/SurvivalSystem');
const CooperationSystem = require('../../models/CooperationSystem');

const handleRaftInteractions = (io, socket, gameRooms, playerManager) => {
  // 实例化系统
  const raftBuilder = new RaftBuilder();
  const resourceManager = new ResourceManager();
  const survivalSystem = new SurvivalSystem();
  const cooperationSystem = new CooperationSystem();
  
  // 收集漂浮资源
  socket.on('resource:collect', (data, callback) => {
    try {
      const { resourceId } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 调用游戏房间的资源收集方法
      const resource = room.onResourceCollected(socket.id, resourceId);
      
      if (!resource) {
        return callback({ success: false, message: '资源不存在或已被收集' });
      }
      
      // 获取玩家数据
      const player = playerManager.getPlayerById(socket.userId);
      if (!player) {
        return callback({ success: false, message: '未找到玩家数据' });
      }
      
      // 确保库存字段存在
      if (!player.gameProgress.inventory) {
        player.gameProgress.inventory = {};
      }
      
      // 更新玩家库存
      if (!player.gameProgress.inventory[resource.type]) {
        player.gameProgress.inventory[resource.type] = 0;
      }
      player.gameProgress.inventory[resource.type] += resource.amount || 1;
      
      // 保存玩家数据
      playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      
      // 返回收集结果
      callback({
        success: true,
        message: `成功收集了 ${resource.amount || 1} 个 ${resource.name || resource.type}`,
        resource,
        inventory: player.gameProgress.inventory
      });
      
      // 如果是稀有资源，可能触发成就
      if (resource.isRare) {
        // 更新玩家成就
        playerManager.updatePlayerAchievement(socket.userId, 'collect_rare_resource', {
          count: (player.gameProgress.achievements?.collect_rare_resource?.count || 0) + 1,
          lastCollected: resource.type,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('资源收集错误:', error);
      callback({ success: false, message: '处理资源收集时出错' });
    }
  });
  
  // 建造木筏组件
  socket.on('raft:build', (data, callback) => {
    try {
      const { componentType, position } = data;
      
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
      
      // 确保库存和木筏数据存在
      if (!player.gameProgress.inventory) {
        player.gameProgress.inventory = {};
      }
      if (!player.gameProgress.raft) {
        player.gameProgress.raft = {
          layout: 'small',
          components: [],
          health: 100,
          lastRepair: Date.now()
        };
      }
      
      // 检查是否可以建造该组件
      if (!raftBuilder.canBuildComponent(player.gameProgress.inventory, componentType)) {
        return callback({ success: false, message: '资源不足，无法建造该组件' });
      }
      
      // 检查木筏是否已达到最大组件数量
      const layoutInfo = raftBuilder.getLayoutInfo(player.gameProgress.raft.layout);
      if (player.gameProgress.raft.components.length >= layoutInfo.maxComponents) {
        return callback({ success: false, message: '木筏已达到最大组件数量，需要先升级木筏' });
      }
      
      // 扣除资源
      raftBuilder.consumeResources(player.gameProgress.inventory, componentType);
      
      // 创建组件
      const component = raftBuilder.createComponent(componentType);
      component.position = position || { x: 0, y: 0 };
      component.id = `comp_${componentType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      component.createdAt = Date.now();
      
      // 添加到木筏
      player.gameProgress.raft.components.push(component);
      
      // 计算木筏属性
      const raftProperties = raftBuilder.calculateRaftProperties(
        player.gameProgress.raft.components,
        player.gameProgress.raft.layout
      );
      player.gameProgress.raft.properties = raftProperties;
      
      // 保存玩家数据
      playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      
      // 广播木筏更新
      room.io.to(room.id).emit('raft:updated', {
        playerId: socket.id,
        playerName: player.nickname,
        raft: player.gameProgress.raft
      });
      
      // 返回建造结果
      callback({
        success: true,
        message: `成功建造了 ${component.name}`,
        component,
        raft: player.gameProgress.raft,
        inventory: player.gameProgress.inventory
      });
    } catch (error) {
      console.error('木筏建造错误:', error);
      callback({ success: false, message: '处理木筏建造时出错' });
    }
  });
  
  // 修理木筏组件
  socket.on('raft:repair', (data, callback) => {
    try {
      const { componentId } = data;
      
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
      
      // 确保木筏数据存在
      if (!player.gameProgress.raft || !player.gameProgress.raft.components) {
        return callback({ success: false, message: '木筏数据不存在' });
      }
      
      // 查找组件
      const componentIndex = player.gameProgress.raft.components.findIndex(c => c.id === componentId);
      if (componentIndex === -1) {
        return callback({ success: false, message: '组件不存在' });
      }
      
      const component = player.gameProgress.raft.components[componentIndex];
      
      // 检查组件是否需要修理
      if (component.health >= component.durability) {
        return callback({ success: false, message: '该组件不需要修理' });
      }
      
      // 修理组件
      const repairResult = raftBuilder.repairComponent(component, player.gameProgress.inventory);
      
      if (!repairResult.success) {
        return callback(repairResult);
      }
      
      // 更新组件
      player.gameProgress.raft.components[componentIndex] = repairResult.component;
      
      // 保存玩家数据
      playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      
      // 广播木筏更新
      room.io.to(room.id).emit('raft:repaired', {
        playerId: socket.id,
        playerName: player.nickname,
        componentId,
        componentName: component.name,
        health: repairResult.component.health
      });
      
      // 返回修理结果
      callback({
        success: true,
        message: repairResult.message,
        component: repairResult.component,
        inventory: player.gameProgress.inventory
      });
    } catch (error) {
      console.error('木筏修理错误:', error);
      callback({ success: false, message: '处理木筏修理时出错' });
    }
  });
  
  // 升级木筏布局
  socket.on('raft:upgrade', (data, callback) => {
    try {
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
      
      // 确保木筏数据存在
      if (!player.gameProgress.raft) {
        player.gameProgress.raft = {
          layout: 'small',
          components: [],
          health: 100,
          lastRepair: Date.now()
        };
      }
      
      // 升级木筏布局
      const upgradeResult = raftBuilder.upgradeRaftLayout(
        player.gameProgress.raft.layout,
        player.gameProgress.inventory
      );
      
      if (!upgradeResult.success) {
        return callback(upgradeResult);
      }
      
      // 更新木筏布局
      player.gameProgress.raft.layout = upgradeResult.newLayout;
      
      // 计算木筏属性
      const raftProperties = raftBuilder.calculateRaftProperties(
        player.gameProgress.raft.components,
        player.gameProgress.raft.layout
      );
      player.gameProgress.raft.properties = raftProperties;
      
      // 保存玩家数据
      playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      
      // 广播木筏升级
      room.io.to(room.id).emit('raft:upgraded', {
        playerId: socket.id,
        playerName: player.nickname,
        layout: upgradeResult.newLayout,
        properties: raftProperties
      });
      
      // 返回升级结果
      callback({
        success: true,
        message: upgradeResult.message,
        layout: upgradeResult.newLayout,
        properties: raftProperties,
        inventory: player.gameProgress.inventory
      });
    } catch (error) {
      console.error('木筏升级错误:', error);
      callback({ success: false, message: '处理木筏升级时出错' });
    }
  });
  
  // 创建协作任务
  socket.on('cooperation:create', (data, callback) => {
    try {
      const { taskType, taskData } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 创建任务ID
      const taskId = `task_${taskType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // 创建协作任务
      const result = cooperationSystem.createCooperativeTask(taskId, taskType, socket.id, taskData);
      
      if (!result.success) {
        return callback(result);
      }
      
      // 广播任务创建
      room.io.to(room.id).emit('cooperation:created', {
        task: result.task,
        initiatorId: socket.id,
        initiatorName: room.players.get(socket.id).nickname
      });
      
      // 返回创建结果
      callback(result);
    } catch (error) {
      console.error('创建协作任务错误:', error);
      callback({ success: false, message: '处理协作任务创建时出错' });
    }
  });
  
  // 加入协作任务
  socket.on('cooperation:join', (data, callback) => {
    try {
      const { taskId, role } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 加入协作任务
      const result = cooperationSystem.joinCooperativeTask(taskId, socket.id, role);
      
      if (!result.success) {
        return callback(result);
      }
      
      // 广播玩家加入
      room.io.to(room.id).emit('cooperation:joined', {
        taskId,
        playerId: socket.id,
        playerName: room.players.get(socket.id).nickname,
        role,
        participants: result.task.participants.length
      });
      
      // 如果任务状态变为进行中，广播任务开始
      if (result.task.status === 'in_progress' && !result.task.startTime) {
        room.io.to(room.id).emit('cooperation:started', {
          taskId,
          participants: result.task.participants.map(id => ({
            id,
            name: room.players.get(id)?.nickname || 'Unknown'
          }))
        });
      }
      
      // 返回加入结果
      callback(result);
    } catch (error) {
      console.error('加入协作任务错误:', error);
      callback({ success: false, message: '处理协作任务加入时出错' });
    }
  });
  
  // 更新协作任务进度
  socket.on('cooperation:update', (data, callback) => {
    try {
      const { taskId, progress, result } = data;
      
      // 获取玩家所在的游戏房间
      const room = gameRooms.getPlayerRoom(socket.id);
      if (!room) {
        return callback({ success: false, message: '未找到游戏房间' });
      }
      
      // 获取任务信息
      const task = cooperationSystem.getTaskInfo(taskId);
      
      // 检查玩家是否是任务参与者
      if (!task || !task.participants.includes(socket.id)) {
        return callback({ success: false, message: '未参与该任务' });
      }
      
      // 更新任务进度
      const updateResult = cooperationSystem.updateTaskProgress(taskId, progress, result);
      
      if (!updateResult.success) {
        return callback(updateResult);
      }
      
      // 广播任务进度更新
      room.io.to(room.id).emit('cooperation:progress', {
        taskId,
        progress: updateResult.task.progress,
        updatedBy: socket.id,
        updaterName: room.players.get(socket.id).nickname
      });
      
      // 如果任务完成，广播任务完成
      if (updateResult.task.status === 'completed') {
        room.io.to(room.id).emit('cooperation:completed', {
          taskId,
          result: updateResult.task.result
        });
        
        // 根据任务类型处理奖励
        handleCooperationReward(room, updateResult.task);
      }
      
      // 返回更新结果
      callback(updateResult);
    } catch (error) {
      console.error('更新协作任务错误:', error);
      callback({ success: false, message: '处理协作任务更新时出错' });
    }
  });
  
  // 消耗食物或水
  socket.on('survival:consume', (data, callback) => {
    try {
      const { itemType, itemId } = data;
      
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
      
      // 确保库存和生存状态存在
      if (!player.gameProgress.inventory) {
        player.gameProgress.inventory = {};
      }
      if (!player.gameProgress.survivalState) {
        player.gameProgress.survivalState = survivalSystem.initializePlayerSurvivalState();
      }
      
      // 检查物品是否存在
      if (!player.gameProgress.inventory[itemType] || player.gameProgress.inventory[itemType] <= 0) {
        return callback({ success: false, message: `没有足够的${itemType}` });
      }
      
      // 获取物品信息
      const itemInfo = resourceManager.getResourceInfo(itemType);
      if (!itemInfo || !itemInfo.consumable) {
        return callback({ success: false, message: '该物品不可消耗' });
      }
      
      // 根据物品类型更新生存状态
      let newState;
      let message = '';
      
      if (itemInfo.hungerRestore) {
        newState = survivalSystem.consumeFood(player.gameProgress.survivalState, itemInfo);
        message = `食用了${itemInfo.name}，恢复了${itemInfo.hungerRestore}点饥饿值`;
      } else if (itemInfo.thirstRestore) {
        newState = survivalSystem.consumeWater(player.gameProgress.survivalState, itemInfo);
        message = `饮用了${itemInfo.name}，恢复了${itemInfo.thirstRestore}点口渴值`;
      } else if (itemInfo.healthRestore) {
        newState = survivalSystem.useMedicalItem(player.gameProgress.survivalState, itemInfo);
        message = `使用了${itemInfo.name}，恢复了${itemInfo.healthRestore}点健康值`;
      } else {
        return callback({ success: false, message: '该物品没有消耗效果' });
      }
      
      // 减少物品数量
      player.gameProgress.inventory[itemType]--;
      
      // 更新生存状态
      player.gameProgress.survivalState = newState;
      
      // 保存玩家数据
      playerManager.savePlayerProgress(socket.userId, player.gameProgress);
      
      // 返回消耗结果
      callback({
        success: true,
        message,
        survivalState: newState,
        inventory: player.gameProgress.inventory
      });
    } catch (error) {
      console.error('消耗物品错误:', error);
      callback({ success: false, message: '处理物品消耗时出错' });
    }
  });
  
  // 处理协作任务奖励
  const handleCooperationReward = (room, task) => {
    // 根据任务类型和参与人数计算奖励
    const bonus = cooperationSystem.calculateCooperationBonus(task);
    
    // 为每个参与者发放奖励
    for (const participantId of task.participants) {
      const socketId = participantId;
      const userId = room.players.get(socketId)?.userId;
      
      if (!userId) continue;
      
      // 获取玩家数据
      const player = playerManager.getPlayerById(userId);
      if (!player) continue;
      
      // 根据任务类型发放不同奖励
      switch (task.type) {
        case 'raft_building':
          // 建造速度加成，可能给予额外资源
          if (!player.gameProgress.inventory) {
            player.gameProgress.inventory = {};
          }
          
          // 返还部分资源
          const resourceTypes = ['wood', 'plastic', 'metal'];
          const randomType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
          const amount = Math.floor(Math.random() * 3) + 1;
          
          if (!player.gameProgress.inventory[randomType]) {
            player.gameProgress.inventory[randomType] = 0;
          }
          player.gameProgress.inventory[randomType] += amount;
          
          // 通知玩家获得奖励
          room.io.to(socketId).emit('reward:received', {
            type: 'resource',
            resourceType: randomType,
            amount,
            message: `协作建造奖励: ${amount} 个 ${randomType}`
          });
          break;
          
        case 'resource_gathering':
          // 资源收集效率加成，可能给予额外资源
          if (!player.gameProgress.inventory) {
            player.gameProgress.inventory = {};
          }
          
          // 随机资源奖励
          const resource = resourceManager.generateRandomResource(room.weather.currentWeather, Math.random() < 0.2);
          
          if (!player.gameProgress.inventory[resource.type]) {
            player.gameProgress.inventory[resource.type] = 0;
          }
          player.gameProgress.inventory[resource.type] += resource.amount;
          
          // 通知玩家获得奖励
          room.io.to(socketId).emit('reward:received', {
            type: 'resource',
            resourceType: resource.type,
            amount: resource.amount,
            message: `协作收集奖励: ${resource.amount} 个 ${resource.name || resource.type}`
          });
          break;
          
        // 其他任务类型的奖励...
      }
      
      // 保存玩家数据
      playerManager.savePlayerProgress(userId, player.gameProgress);
    }
  };
};

module.exports = handleRaftInteractions;