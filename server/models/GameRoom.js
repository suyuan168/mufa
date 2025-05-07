/**
 * 游戏房间类
 * 管理一个游戏实例的所有状态，包括玩家、资源、敌人等
 */
const Shark = require('./Shark');
const Weather = require('./Weather');
const IslandLocation = require('./IslandLocation');
const NPC = require('./NPC');
const RaftBuilder = require('./RaftBuilder');
const ResourceManager = require('./ResourceManager');
const SurvivalSystem = require('./SurvivalSystem');
const CooperationSystem = require('./CooperationSystem');

class GameRoom {
  constructor(id, io) {
    this.id = id;
    this.io = io; // Socket.io实例
    this.players = new Map(); // 玩家映射表
    this.sharks = new Map(); // 鲨鱼映射表
    this.resources = []; // 漂浮资源
    this.locations = new Map(); // 探索位置(岛屿等)
    this.npcs = new Map(); // NPC(商人、海盗等)
    this.lastUpdate = Date.now();
    this.tickRate = 60; // 每秒更新次数
    this.tickInterval = null;
    this.maxPlayersAllowed = 4; // 最大玩家数量

    // 房间设置
    this.settings = {
      resourceSpawnRate: 10000, // 资源生成间隔(ms)
      sharkSpawnRate: 60000, // 鲨鱼生成间隔(ms)
      maxSharks: 3, // 最大鲨鱼数量
      raftHealth: 100, // 木筏初始生命值
      gameAreaSize: 2000, // 游戏区域边界
      locationSpawnRate: 180000, // 岛屿生成间隔(ms)
      maxLocations: 5, // 最大岛屿/探索点数量
      npcSpawnRate: 300000, // NPC生成间隔(ms)
      maxNPCs: 3 // 最大NPC数量
    };

    // 房间状态
    this.state = {
      active: false,
      startTime: null,
      lastResourceSpawn: 0,
      lastSharkSpawn: 0,
      lastLocationSpawn: 0,
      lastNPCSpawn: 0,
      raftHealth: this.settings.raftHealth
    };

    // 天气系统
    this.weather = new Weather(this);
    
    // 木筏建造系统
    this.raftBuilder = new RaftBuilder();
    
    // 资源管理系统
    this.resourceManager = new ResourceManager();
    
    // 生存系统
    this.survivalSystem = new SurvivalSystem();
    
    // 协作系统
    this.cooperationSystem = new CooperationSystem();

    // 初始化房间
    this.initialize();
  }

  // 初始化房间
  initialize() {
    this.state.active = true;
    this.state.startTime = Date.now();
    
    // 开始游戏循环
    this.startGameLoop();
    
    console.log(`游戏房间 ${this.id} 已创建`);
  }

  // 添加玩家到房间
  addPlayer(socketId, playerData) {
    // 检查房间是否已满
    if (this.players.size >= this.maxPlayersAllowed) {
      return false;
    }

    // 添加玩家
    this.players.set(socketId, {
      socketId,
      userId: playerData.userId,
      nickname: playerData.nickname,
      position: { x: 0, y: 0 },
      raftSize: playerData.gameProgress.raftSize || 1,
      raftHealth: this.settings.raftHealth,
      lastActivity: Date.now(),
      inventory: playerData.gameProgress.inventory || {}
    });

    console.log(`玩家 ${playerData.nickname} 加入房间 ${this.id}`);
    return true;
  }

  // 移除玩家
  removePlayer(socketId) {
    if (this.players.has(socketId)) {
      const player = this.players.get(socketId);
      console.log(`玩家 ${player.nickname} 离开房间 ${this.id}`);
      this.players.delete(socketId);

      // 如果房间没有玩家了，停止游戏循环
      if (this.players.size === 0) {
        this.stopGameLoop();
        this.state.active = false;
        console.log(`房间 ${this.id} 没有玩家，已停止更新`);
      }

      return true;
    }
    return false;
  }

  // 检查玩家是否活跃
  isPlayerActive(socketId) {
    return this.players.has(socketId);
  }

  // 获取活跃玩家列表
  getActivePlayers() {
    return Array.from(this.players.values());
  }

  // 更新玩家位置
  updatePlayerPosition(socketId, position) {
    if (this.players.has(socketId)) {
      const player = this.players.get(socketId);
      player.position = position;
      player.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  // 启动游戏循环
  startGameLoop() {
    if (this.tickInterval) return;
    
    const tickTime = 1000 / this.tickRate;
    this.tickInterval = setInterval(() => this.update(), tickTime);
    console.log(`房间 ${this.id} 游戏循环已启动，帧率: ${this.tickRate}fps`);
  }

  // 停止游戏循环
  stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      console.log(`房间 ${this.id} 游戏循环已停止`);
    }
  }

  // 主更新循环
  update() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    // 只有在房间活跃时才更新
    if (!this.state.active || this.players.size === 0) return;

    // 更新天气系统
    this.weather.update(deltaTime);

    // 更新游戏实体
    this.updateSharks(deltaTime);
    this.updateLocations(deltaTime);
    this.updateNPCs(deltaTime);
    this.updatePlayerSurvivalStates(deltaTime);
    this.spawnResources(now);
    this.spawnSharks(now);
    this.spawnLocations(now);
    this.spawnNPCs(now);

    // 广播游戏状态给所有玩家
    this.broadcastGameState();
  }

  // 更新所有鲨鱼
  updateSharks(deltaTime) {
    for (const [id, shark] of this.sharks.entries()) {
      shark.update(deltaTime);
    }
  }
  
  // 更新所有探索位置 (岛屿等)
  updateLocations(deltaTime) {
    // 计算游戏内分钟数
    const gameMinutes = deltaTime / (1000 * 60);
    
    for (const [id, location] of this.locations.entries()) {
      location.update(gameMinutes);
    }
  }
  
  // 更新所有NPC
  updateNPCs(deltaTime) {
    for (const [id, npc] of this.npcs.entries()) {
      npc.update(deltaTime);
    }
  }

  // 生成漂浮资源
  spawnResources(now) {
    // 检查是否应该生成新资源
    if (now - this.state.lastResourceSpawn < this.settings.resourceSpawnRate) {
      return;
    }

    this.state.lastResourceSpawn = now;

    // 使用资源管理器生成随机资源
    const resource = this.resourceManager.generateRandomResource(this.weather.currentWeather);
    
    // 随机位置 (在游戏区域边缘)
    resource.position = this.getRandomEdgePosition();
    
    // 添加到资源列表
    this.resources.push(resource);
    
    // 移除超过过期时间的旧资源
    const currentTime = now;
    this.resources = this.resources.filter(r => !this.resourceManager.isResourceExpired(r, currentTime));
    
    // 广播资源生成
    this.io.to(this.id).emit('resource:spawn', resource);
    
    // 尝试生成天气相关特殊资源
    const specialResource = this.resourceManager.generateWeatherSpecificResource(this.weather.currentWeather);
    if (specialResource) {
      specialResource.position = this.getRandomPositionInArea(300, 1000);
      this.resources.push(specialResource);
      
      // 广播特殊资源生成
      this.io.to(this.id).emit('resource:special', specialResource);
    }
  }

  // 添加资源 (供其他系统调用)
  addResource(resource) {
    this.resources.push(resource);
    return resource;
  }

  // 生成鲨鱼
  spawnSharks(now) {
    // 检查是否应该生成新鲨鱼
    if (now - this.state.lastSharkSpawn < this.settings.sharkSpawnRate || 
        this.sharks.size >= this.settings.maxSharks) {
      return;
    }

    this.state.lastSharkSpawn = now;

    // 随机位置 (在游戏区域外围)
    const position = this.getRandomEdgePosition(300); // 距边缘300单位
    
    // 创建鲨鱼ID
    const sharkId = `shark_${now}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 创建鲨鱼实例
    const shark = new Shark(sharkId, position, this);
    
    // 添加到鲨鱼列表
    this.sharks.set(sharkId, shark);
    
    // 广播鲨鱼生成
    this.io.to(this.id).emit('shark:spawn', shark.getClientData());
    
    console.log(`鲨鱼 ${sharkId} 已在房间 ${this.id} 生成`);
  }
  
  // 生成探索位置 (岛屿、沉船等)
  spawnLocations(now) {
    // 检查是否应该生成新位置
    if (now - this.state.lastLocationSpawn < this.settings.locationSpawnRate || 
        this.locations.size >= this.settings.maxLocations) {
      return;
    }
    
    this.state.lastLocationSpawn = now;
    
    // 位置类型
    const locationTypes = ['island', 'shipwreck', 'floatingcrate', 'abandonedraft', 'researchstation'];
    
    // 随机选择一种位置类型，但权重不同
    const weights = [0.3, 0.25, 0.25, 0.15, 0.05]; // 权重总和为1
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedType;
    
    for (let i = 0; i < locationTypes.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        selectedType = locationTypes[i];
        break;
      }
    }
    
    // 随机位置 (在游戏区域中，但不在中心)
    const position = this.getRandomPositionInArea(600, 1500);
    
    // 创建位置ID
    const locationId = `loc_${selectedType}_${now}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 创建位置实例
    const location = new IslandLocation(locationId, selectedType, position, this);
    
    // 添加到位置列表
    this.locations.set(locationId, location);
    
    // 广播位置生成
    this.io.to(this.id).emit('location:spawn', location.getClientData());
    
    console.log(`探索位置 ${selectedType} (${locationId}) 已在房间 ${this.id} 生成`);
  }
  
  // 移除探索位置
  removeLocation(locationId) {
    if (this.locations.has(locationId)) {
      this.locations.delete(locationId);
      return true;
    }
    return false;
  }
  
  // 生成NPC (商人、海盗)
  spawnNPCs(now) {
    // 检查是否应该生成新NPC
    if (now - this.state.lastNPCSpawn < this.settings.npcSpawnRate || 
        this.npcs.size >= this.settings.maxNPCs) {
      return;
    }
    
    this.state.lastNPCSpawn = now;
    
    // NPC类型
    const npcTypes = ['trader', 'pirate'];
    const selectedType = npcTypes[Math.random() < 0.7 ? 0 : 1]; // 70%几率为商人，30%为海盗
    
    // 随机位置 (在游戏区域边缘)
    const position = this.getRandomEdgePosition(200);
    
    // 创建NPC ID
    const npcId = `npc_${selectedType}_${now}_${Math.random().toString(36).substring(2, 7)}`;
    
    // 创建NPC实例
    const npc = new NPC(npcId, selectedType, position, this);
    
    // 添加到NPC列表
    this.npcs.set(npcId, npc);
    
    // 广播NPC生成
    this.io.to(this.id).emit('npc:spawn', npc.getClientData());
    
    console.log(`NPC ${selectedType} (${npcId}) 已在房间 ${this.id} 生成`);
  }
  
  // 移除NPC
  removeNPC(npcId) {
    if (this.npcs.has(npcId)) {
      this.npcs.delete(npcId);
      return true;
    }
    return false;
  }

  // 在游戏区域边缘获取随机位置
  getRandomEdgePosition(inset = 0) {
    const bounds = this.settings.gameAreaSize;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    let x, y;
    
    switch (side) {
      case 0: // top
        x = Math.random() * (bounds * 2) - bounds;
        y = -bounds + inset;
        break;
      case 1: // right
        x = bounds - inset;
        y = Math.random() * (bounds * 2) - bounds;
        break;
      case 2: // bottom
        x = Math.random() * (bounds * 2) - bounds;
        y = bounds - inset;
        break;
      case 3: // left
        x = -bounds + inset;
        y = Math.random() * (bounds * 2) - bounds;
        break;
    }
    
    return { x, y };
  }
  
  // 在游戏区域内获取随机位置 (minDistance为距中心最小距离，maxDistance为最大距离)
  getRandomPositionInArea(minDistance = 0, maxDistance = null) {
    if (!maxDistance) {
      maxDistance = this.settings.gameAreaSize;
    }
    
    // 随机角度
    const angle = Math.random() * Math.PI * 2;
    
    // 随机距离 (在最小和最大距离之间)
    const distance = Math.random() * (maxDistance - minDistance) + minDistance;
    
    // 计算坐标
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    return { x, y };
  }
  
  // 获取随机位置 (用于资源生成等)
  getRandomPosition(minDistanceFromCenter = 0) {
    return this.getRandomPositionInArea(minDistanceFromCenter);
  }

  // 响应玩家收集资源
  onResourceCollected(socketId, resourceId) {
    // 查找资源
    const resourceIndex = this.resources.findIndex(r => r.id === resourceId);
    if (resourceIndex === -1) return null;
    
    // 获取资源
    const resource = this.resources[resourceIndex];
    
    // 从资源列表中移除
    this.resources.splice(resourceIndex, 1);
    
    // 获取玩家信息
    const player = this.players.get(socketId);
    if (!player) return null;
    
    // 检查是否有协作任务
    let cooperationBonus = 0;
    const gatheringTasks = Array.from(this.cooperationSystem.activeCooperations.values())
      .filter(task => 
        task.type === 'resource_gathering' && 
        task.status === 'in_progress' && 
        task.participants.includes(socketId)
      );
    
    if (gatheringTasks.length > 0) {
      // 应用协作加成
      const task = gatheringTasks[0]; // 使用第一个匹配的任务
      const bonus = this.cooperationSystem.calculateCooperationBonus(task);
      cooperationBonus = bonus.bonus;
      
      // 更新任务进度
      this.cooperationSystem.updateTaskProgress(
        task.id, 
        Math.min(100, task.progress + 5), // 每收集一个资源增加5%进度
        { lastResource: resource.type }
      );
    }
    
    // 应用生存系统更新
    if (player.survivalState) {
      // 收集资源消耗能量
      player.survivalState = this.survivalSystem.takeDamage(
        player.survivalState, 
        1, // 消耗1点能量
        'energy'
      );
    }
    
    // 广播资源被收集
    this.io.to(this.id).emit('resource:collected', {
      resourceId,
      playerId: socketId,
      playerName: player.nickname,
      resourceType: resource.type,
      cooperationBonus: cooperationBonus > 0 ? `+${Math.round(cooperationBonus * 100)}%` : null
    });
    
    return resource;
  }

  // 鲨鱼攻击木筏
  onSharkAttack(shark, targetPlayer, damage) {
    if (!this.players.has(targetPlayer.socketId)) return;
    
    const player = this.players.get(targetPlayer.socketId);
    
    // 降低木筏生命值
    player.raftHealth -= damage;
    
    // 确保不为负数
    if (player.raftHealth < 0) player.raftHealth = 0;
    
    // 广播攻击事件
    this.io.to(this.id).emit('shark:attack', {
      sharkId: shark.id,
      targetId: targetPlayer.socketId,
      damage: damage,
      remainingHealth: player.raftHealth
    });
    
    console.log(`鲨鱼 ${shark.id} 攻击玩家 ${player.nickname} 的木筏，造成 ${damage} 点伤害，剩余生命值: ${player.raftHealth}`);
    
    // 如果木筏被摧毁
    if (player.raftHealth <= 0) {
      this.onRaftDestroyed(player);
    }
  }

  // 木筏被摧毁
  onRaftDestroyed(player) {
    // 广播木筏摧毁事件
    this.io.to(this.id).emit('raft:destroyed', {
      playerId: player.socketId,
      playerName: player.nickname
    });
    
    console.log(`玩家 ${player.nickname} 的木筏被摧毁`);
    
    // 可以在这里实现游戏重生、惩罚等机制
  }

  // 对玩家木筏造成伤害 (用于天气、海盗等)
  damagePlayerRaft(socketId, damage, source) {
    if (!this.players.has(socketId)) return false;
    
    const player = this.players.get(socketId);
    
    // 降低木筏生命值
    player.raftHealth -= damage;
    
    // 确保不为负数
    if (player.raftHealth < 0) player.raftHealth = 0;
    
    // 广播伤害事件
    this.io.to(this.id).emit('raft:damaged', {
      playerId: socketId,
      playerName: player.nickname,
      damage: damage,
      source: source,
      remainingHealth: player.raftHealth
    });
    
    // 如果木筏被摧毁
    if (player.raftHealth <= 0) {
      this.onRaftDestroyed(player);
    }
    
    return true;
  }

  // 玩家攻击鲨鱼
  onPlayerAttackShark(socketId, sharkId, damage) {
    if (!this.sharks.has(sharkId)) return false;
    
    const shark = this.sharks.get(sharkId);
    const remainingHealth = shark.takeDamage(damage);
    
    // 广播鲨鱼受伤事件
    this.io.to(this.id).emit('shark:damaged', {
      sharkId: shark.id,
      attackerId: socketId,
      damage: damage,
      remainingHealth: remainingHealth
    });
    
    return true;
  }

  // 鲨鱼死亡
  onSharkDeath(shark) {
    // 从鲨鱼列表移除
    this.sharks.delete(shark.id);
    
    // 广播鲨鱼死亡事件
    this.io.to(this.id).emit('shark:death', {
      sharkId: shark.id
    });
    
    console.log(`鲨鱼 ${shark.id} 在房间 ${this.id} 中死亡`);
  }
  
  // 海盗攻击玩家
  onPirateAttack(pirate, targetPlayer, damage) {
    if (!this.players.has(targetPlayer.socketId)) return;
    
    const player = this.players.get(targetPlayer.socketId);
    
    // 降低木筏生命值 (海盗攻击伤害较小)
    player.raftHealth -= damage;
    
    // 确保不为负数
    if (player.raftHealth < 0) player.raftHealth = 0;
    
    // 广播攻击事件
    this.io.to(this.id).emit('pirate:attack', {
      pirateId: pirate.id,
      targetId: targetPlayer.socketId,
      damage: damage,
      remainingHealth: player.raftHealth
    });
    
    console.log(`海盗 ${pirate.id} 攻击玩家 ${player.nickname} 的木筏，造成 ${damage} 点伤害，剩余生命值: ${player.raftHealth}`);
    
    // 如果木筏被摧毁
    if (player.raftHealth <= 0) {
      this.onRaftDestroyed(player);
    }
  }
  
  // 玩家与位置互动
  onPlayerInteractWithLocation(socketId, locationId) {
    if (!this.players.has(socketId) || !this.locations.has(locationId)) {
      return { success: false, message: "玩家或位置不存在" };
    }
    
    const player = this.players.get(socketId);
    const location = this.locations.get(locationId);
    
    // 调用位置的互动方法
    return location.interact(player);
  }
  
  // 玩家与NPC互动
  onPlayerInteractWithNPC(socketId, npcId) {
    if (!this.players.has(socketId) || !this.npcs.has(npcId)) {
      return { success: false, message: "玩家或NPC不存在" };
    }
    
    const player = this.players.get(socketId);
    const npc = this.npcs.get(npcId);
    
    // 调用NPC的互动方法
    return npc.interact(player);
  }
  
  // 玩家与NPC交易
  onPlayerTradeWithNPC(socketId, npcId, itemIndex, quantity) {
    if (!this.players.has(socketId) || !this.npcs.has(npcId)) {
      return { success: false, message: "玩家或NPC不存在" };
    }
    
    const player = this.players.get(socketId);
    const npc = this.npcs.get(npcId);
    
    // 调用NPC的交易方法
    return npc.tradeItem(player, itemIndex, quantity);
  }
  
  // 玩家攻击海盗
  onPlayerAttackPirate(socketId, pirateId, damage) {
    if (!this.players.has(socketId) || !this.npcs.has(pirateId)) {
      return { success: false, message: "玩家或海盗不存在" };
    }
    
    const player = this.players.get(socketId);
    const pirate = this.npcs.get(pirateId);
    
    // 检查是否是海盗类型
    if (pirate.type !== 'pirate') {
      return { success: false, message: "目标不是海盗" };
    }
    
    // 海盗受到伤害
    const loot = pirate.takeDamage(damage);
    
    // 如果海盗被击败且有掉落物
    if (loot) {
      return { 
        success: true, 
        message: "海盗被击败！", 
        loot: loot 
      };
    }
    
    return { 
      success: true, 
      message: "攻击了海盗", 
      remainingHealth: pirate.health 
    };
  }

  // 更新所有玩家的生存状态
  updatePlayerSurvivalStates(deltaTime) {
    for (const [socketId, player] of this.players.entries()) {
      // 如果玩家没有生存状态，初始化一个
      if (!player.survivalState) {
        player.survivalState = this.survivalSystem.initializePlayerSurvivalState();
      }
      
      // 更新玩家的生存状态
      player.survivalState = this.survivalSystem.updateSurvivalState(
        player.survivalState,
        deltaTime,
        this.weather.currentWeather,
        this.weather.currentTime
      );
      
      // 检查玩家是否存活
      if (!this.survivalSystem.isPlayerAlive(player.survivalState)) {
        // 玩家死亡处理
        this.onPlayerDeath(socketId, 'survival');
      }
      
      // 如果生存状态发生重大变化，通知玩家
      if (player.survivalState.isHungry || 
          player.survivalState.isThirsty || 
          player.survivalState.isInjured || 
          player.survivalState.isCold || 
          player.survivalState.isHot) {
        
        const status = this.survivalSystem.getSurvivalStatusDescription(player.survivalState);
        
        // 向玩家发送生存状态更新
        this.io.to(socketId).emit('survival:update', {
          survivalState: player.survivalState,
          status: status
        });
      }
    }
  }
  
  // 处理玩家死亡
  onPlayerDeath(socketId, cause) {
    const player = this.players.get(socketId);
    if (!player) return;
    
    // 广播玩家死亡事件
    this.io.to(this.id).emit('player:death', {
      playerId: socketId,
      playerName: player.nickname,
      cause: cause
    });
    
    console.log(`玩家 ${player.nickname} 在房间 ${this.id} 中死亡，原因: ${cause}`);
    
    // 重置玩家生存状态
    player.survivalState = this.survivalSystem.initializePlayerSurvivalState();
    
    // 掉落部分资源
    if (player.inventory) {
      // 随机选择一些资源掉落
      const resourceTypes = Object.keys(player.inventory);
      const dropCount = Math.min(3, resourceTypes.length);
      
      for (let i = 0; i < dropCount; i++) {
        const randomIndex = Math.floor(Math.random() * resourceTypes.length);
        const resourceType = resourceTypes[randomIndex];
        
        // 移除已选择的资源类型，避免重复
        resourceTypes.splice(randomIndex, 1);
        
        // 掉落一半的资源
        const amount = Math.ceil(player.inventory[resourceType] / 2);
        if (amount <= 0) continue;
        
        // 创建掉落资源
        const resource = {
          id: `res_death_${resourceType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: resourceType,
          name: this.resourceManager.getResourceInfo(resourceType)?.name || resourceType,
          amount: amount,
          position: { ...player.position },
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000, // 5分钟后过期
          fromDeath: true
        };
        
        // 添加到资源列表
        this.resources.push(resource);
        
        // 广播资源生成
        this.io.to(this.id).emit('resource:death_drop', {
          resource,
          playerId: socketId,
          playerName: player.nickname
        });
        
        // 减少玩家库存
        player.inventory[resourceType] -= amount;
      }
    }
    
    // 将玩家移动到安全位置
    player.position = { x: 0, y: 0 };
  }
  
  // 广播游戏状态给所有玩家
  broadcastGameState() {
    // 只广播经常变化的数据以减少数据量
    const gameState = {
      sharks: Array.from(this.sharks.values()).map(shark => shark.getClientData()),
      npcs: Array.from(this.npcs.values()).map(npc => npc.getClientData()),
      players: Array.from(this.players.entries()).map(([id, player]) => ({
        id,
        position: player.position,
        raftHealth: player.raftHealth,
        survivalStatus: player.survivalState ? {
          hunger: player.survivalState.hunger,
          thirst: player.survivalState.thirst,
          health: player.survivalState.health,
          energy: player.survivalState.energy,
          isHungry: player.survivalState.isHungry,
          isThirsty: player.survivalState.isThirsty,
          isInjured: player.survivalState.isInjured
        } : null
      })),
      weather: this.weather.getWeatherState(),
      resources: this.resources.map(resource => ({
        id: resource.id,
        type: resource.type,
        position: resource.position
      }))
    };
    
    this.io.to(this.id).emit('game:state', gameState);
  }

  // 获取房间状态
  getRoomState() {
    return {
      id: this.id,
      playerCount: this.players.size,
      active: this.state.active,
      startTime: this.state.startTime,
      raftHealth: this.state.raftHealth,
      weather: this.weather.currentWeather,
      time: this.weather.currentTime
    };
  }
}

module.exports = GameRoom;