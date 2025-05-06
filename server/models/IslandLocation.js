/**
 * 岛屿和探索位置模型
 * 定义可探索的岛屿、沉船和特殊区域
 */
class IslandLocation {
  constructor(id, type, position, gameRoom) {
    this.id = id;
    this.type = type; // island, shipwreck, floatingcrate, etc.
    this.position = position;
    this.gameRoom = gameRoom;
    this.visited = new Set(); // 已访问过该位置的玩家ID
    this.loot = []; // 可获取的资源
    this.cooldown = 0; // 资源重生冷却时间
    this.size = 100; // 默认尺寸，决定互动范围
    this.durability = 100; // 耐久度，某些位置可被摧毁/耗尽
    this.puzzleSolved = false; // 是否已解谜（适用于有谜题的地点）

    // 根据类型初始化
    this.initializeByType();
  }

  // 根据类型初始化岛屿属性
  initializeByType() {
    switch (this.type) {
      case 'island':
        this.size = 200;
        this.generateIslandLoot();
        break;
      case 'shipwreck':
        this.size = 150;
        this.generateShipwreckLoot();
        break;
      case 'floatingcrate':
        this.size = 50;
        this.durability = 20;
        this.generateCrateLoot();
        break;
      case 'abandonedraft':
        this.size = 100;
        this.generateRaftLoot();
        break;
      case 'researchstation':
        this.size = 180;
        this.generateResearchLoot();
        this.hasPuzzle = true;
        break;
    }
  }

  // 生成岛屿资源
  generateIslandLoot() {
    // 岛屿上可能有更多木材和植物类资源
    this.loot = [
      { type: 'wood', amount: Math.floor(Math.random() * 15) + 10 },
      { type: 'leaf', amount: Math.floor(Math.random() * 8) + 5 },
      { type: 'fruit', amount: Math.floor(Math.random() * 6) + 2 },
      { type: 'seed', amount: Math.floor(Math.random() * 4) + 1 }
    ];
    
    // 低概率生成稀有资源
    if (Math.random() < 0.3) {
      this.loot.push({ 
        type: 'rare_seed', 
        amount: 1, 
        isRare: true 
      });
    }
    
    // 低概率生成宝箱
    if (Math.random() < 0.2) {
      this.loot.push({ 
        type: 'treasure_chest', 
        amount: 1, 
        isRare: true,
        requiresKey: Math.random() < 0.5 // 50%概率需要钥匙开启
      });
    }
  }

  // 生成沉船资源
  generateShipwreckLoot() {
    // 沉船上可能有更多金属和技术类资源
    this.loot = [
      { type: 'metal', amount: Math.floor(Math.random() * 10) + 8 },
      { type: 'plastic', amount: Math.floor(Math.random() * 8) + 5 },
      { type: 'rope', amount: Math.floor(Math.random() * 4) + 2 },
      { type: 'battery', amount: Math.floor(Math.random() * 2) + 1 }
    ];
    
    // 概率生成蓝图
    if (Math.random() < 0.4) {
      const blueprintTypes = ['engine', 'purifier', 'radar', 'anchor'];
      this.loot.push({ 
        type: 'blueprint_' + blueprintTypes[Math.floor(Math.random() * blueprintTypes.length)], 
        amount: 1, 
        isRare: true 
      });
    }
    
    // 极低概率生成高级装备
    if (Math.random() < 0.1) {
      this.loot.push({ 
        type: 'advanced_equipment', 
        amount: 1, 
        isRare: true 
      });
    }
  }

  // 生成漂浮箱资源
  generateCrateLoot() {
    // 箱子内部资源随机性较高
    const possibleItems = ['wood', 'metal', 'plastic', 'rope', 'food', 'water', 'tool_parts'];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    
    this.loot = [];
    
    for (let i = 0; i < itemCount; i++) {
      const itemType = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      this.loot.push({
        type: itemType,
        amount: Math.floor(Math.random() * 5) + 1
      });
    }
    
    // 小概率生成贵重物品
    if (Math.random() < 0.15) {
      this.loot.push({
        type: 'valuable_item',
        amount: 1,
        isRare: true
      });
    }
  }

  // 生成废弃木筏资源
  generateRaftLoot() {
    this.loot = [
      { type: 'wood', amount: Math.floor(Math.random() * 8) + 5 },
      { type: 'rope', amount: Math.floor(Math.random() * 3) + 1 },
      { type: 'plastic', amount: Math.floor(Math.random() * 4) + 2 }
    ];
    
    // 有可能找到之前玩家的物资
    if (Math.random() < 0.3) {
      this.loot.push({
        type: 'player_supplies',
        amount: 1,
        randomized: true
      });
    }
    
    // 有可能找到特殊航海日志，触发任务
    if (Math.random() < 0.2) {
      this.loot.push({
        type: 'journal',
        amount: 1,
        questItem: true
      });
    }
  }

  // 生成研究站资源
  generateResearchLoot() {
    this.loot = [
      { type: 'battery', amount: Math.floor(Math.random() * 2) + 1 },
      { type: 'tech_parts', amount: Math.floor(Math.random() * 3) + 2 },
      { type: 'research_notes', amount: 1, questItem: true }
    ];
    
    // 解谜后获得的特殊物品
    this.puzzleLoot = [
      { type: 'advanced_blueprint', amount: 1, isRare: true },
      { type: 'tech_components', amount: Math.floor(Math.random() * 2) + 3, isRare: true }
    ];
  }

  // 尝试解谜
  attemptPuzzle(playerId, solution) {
    if (!this.hasPuzzle || this.puzzleSolved) return { success: false, message: "此地点没有未解决的谜题" };
    
    // 简单谜题系统，后续可以扩展为更复杂的谜题
    const correctSolution = this.id.substring(0, 4); // 使用ID前四位作为简单谜题答案
    
    if (solution === correctSolution) {
      this.puzzleSolved = true;
      
      // 将谜题奖励添加到可获取资源中
      this.loot = [...this.loot, ...this.puzzleLoot];
      
      return { 
        success: true, 
        message: "谜题解决成功！解锁了新的资源。", 
        reward: this.puzzleLoot 
      };
    }
    
    return { success: false, message: "谜题解答错误，请再试一次。" };
  }

  // 玩家与位置互动
  interact(player) {
    // 检查玩家是否在互动范围内
    const distance = this.calculateDistance(player.position);
    if (distance > this.size) {
      return { success: false, message: "距离太远，无法互动" };
    }
    
    // 如果该位置已被耗尽
    if (this.durability <= 0) {
      return { success: false, message: "此地点已被耗尽，没有可收集的资源" };
    }
    
    // 如果玩家最近已经访问过该位置（防止反复收集）
    if (this.visited.has(player.socketId) && this.cooldown > 0) {
      return { 
        success: false, 
        message: `此地点正在恢复中，${this.cooldown}分钟后可再次收集`, 
        cooldown: this.cooldown 
      };
    }
    
    // 收集资源
    const collectedLoot = this.collectLoot(player);
    
    // 广播玩家发现地点的消息
    if (!this.visited.has(player.socketId)) {
      this.gameRoom.io.to(this.gameRoom.id).emit('location:discovered', {
        playerId: player.socketId,
        playerName: player.nickname,
        locationType: this.type,
        locationId: this.id
      });
    }
    
    // 添加到已访问集合并设置冷却时间
    this.visited.add(player.socketId);
    this.cooldown = 15; // 15分钟冷却时间
    
    // 更新位置耐久度
    this.durability -= collectedLoot.length > 0 ? 5 : 0;
    
    // 如果耐久度耗尽，广播位置被耗尽的消息
    if (this.durability <= 0) {
      this.gameRoom.io.to(this.gameRoom.id).emit('location:depleted', {
        locationId: this.id,
        locationType: this.type
      });
      
      // 对于漂浮箱这类物品，可以考虑从游戏世界中移除
      if (this.type === 'floatingcrate') {
        this.gameRoom.removeLocation(this.id);
      }
    }
    
    return {
      success: true,
      message: `从${this.getLocationName()}收集了资源`,
      loot: collectedLoot,
      durability: this.durability,
      remainingCapacity: this.durability > 0
    };
  }

  // 收集地点资源
  collectLoot(player) {
    const collectedItems = [];
    
    // 复制可收集的资源列表，防止修改原始数据
    const availableLoot = [...this.loot];
    
    for (const item of availableLoot) {
      // 特殊处理：如果物品需要钥匙且玩家没有
      if (item.requiresKey && !player.hasItem('key')) {
        continue;
      }
      
      // 计算实际收集量（随机或固定）
      let amount = item.amount;
      if (item.randomized) {
        amount = Math.ceil(Math.random() * amount);
      }
      
      // 添加到收集列表
      collectedItems.push({
        type: item.type,
        amount: amount,
        isRare: item.isRare || false,
        questItem: item.questItem || false
      });
      
      // 如果是任务物品或一次性物品，从原始列表中移除
      if (item.questItem || item.isRare) {
        const index = this.loot.findIndex(i => i.type === item.type);
        if (index !== -1) {
          this.loot.splice(index, 1);
        }
      }
    }
    
    return collectedItems;
  }

  // 计算与玩家的距离
  calculateDistance(playerPosition) {
    return Math.sqrt(
      Math.pow(this.position.x - playerPosition.x, 2) +
      Math.pow(this.position.y - playerPosition.y, 2)
    );
  }

  // 更新位置状态（用于冷却时间等）
  update(deltaTime) {
    // 更新冷却时间（deltaTime为分钟）
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
      if (this.cooldown < 0) this.cooldown = 0;
    }
  }

  // 获取位置名称
  getLocationName() {
    const names = {
      'island': '小岛',
      'shipwreck': '沉船',
      'floatingcrate': '漂浮箱',
      'abandonedraft': '废弃木筏',
      'researchstation': '研究站'
    };
    
    return names[this.type] || '未知地点';
  }

  // 获取位置数据（用于发送给客户端）
  getClientData() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      name: this.getLocationName(),
      depleted: this.durability <= 0,
      puzzleSolved: this.puzzleSolved
    };
  }
}

module.exports = IslandLocation; 