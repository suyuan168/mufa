/**
 * NPC模型
 * 用于商人、海盗等NPC角色
 */
class NPC {
  constructor(id, type, position, gameRoom) {
    this.id = id;
    this.type = type; // 'trader' 或 'pirate'
    this.position = position;
    this.gameRoom = gameRoom;
    this.direction = { x: 0, y: 0 };
    this.speed = type === 'pirate' ? 100 : 40; // 海盗移动更快
    this.state = 'idle'; // idle, moving, trading, attacking
    this.inventory = []; // NPC携带的物品
    this.health = type === 'pirate' ? 80 : 50;
    this.lastInteractionTime = 0; // 上次互动时间
    this.interactionCooldown = 60000; // 互动冷却时间 (ms)
    
    // 初始化NPC库存和行为
    this.initialize();
  }
  
  // 初始化NPC
  initialize() {
    if (this.type === 'trader') {
      this.initializeTraderInventory();
    } else if (this.type === 'pirate') {
      this.initializePirateAttributes();
    }
  }
  
  // 初始化商人库存
  initializeTraderInventory() {
    // 商人出售的物品
    const possibleItems = [
      { type: 'wood', price: 2, quantity: Math.floor(Math.random() * 15) + 10 },
      { type: 'plastic', price: 2, quantity: Math.floor(Math.random() * 10) + 5 },
      { type: 'metal', price: 3, quantity: Math.floor(Math.random() * 8) + 3 },
      { type: 'rope', price: 4, quantity: Math.floor(Math.random() * 5) + 3 },
      { type: 'fabric', price: 4, quantity: Math.floor(Math.random() * 5) + 2 },
      { type: 'battery', price: 6, quantity: Math.floor(Math.random() * 3) + 1 },
      { type: 'food', price: 3, quantity: Math.floor(Math.random() * 8) + 5 },
      { type: 'water', price: 3, quantity: Math.floor(Math.random() * 8) + 5 },
      { type: 'medical_kit', price: 8, quantity: Math.floor(Math.random() * 2) + 1 },
      { type: 'tool_parts', price: 5, quantity: Math.floor(Math.random() * 4) + 2 }
    ];
    
    // 随机选择5-8种物品作为库存
    const itemCount = Math.floor(Math.random() * 4) + 5;
    const shuffledItems = [...possibleItems].sort(() => 0.5 - Math.random());
    this.inventory = shuffledItems.slice(0, itemCount);
    
    // 随机添加一个稀有物品 (25%概率)
    if (Math.random() < 0.25) {
      const rareItems = [
        { type: 'metal_purifier_parts', price: 15, quantity: 1, isRare: true },
        { type: 'engine_component', price: 20, quantity: 1, isRare: true },
        { type: 'navigation_chart', price: 12, quantity: 1, isRare: true },
        { type: 'diving_equipment', price: 18, quantity: 1, isRare: true },
        { type: 'special_weapon', price: 25, quantity: 1, isRare: true }
      ];
      
      const rareItem = rareItems[Math.floor(Math.random() * rareItems.length)];
      this.inventory.push(rareItem);
    }
    
    // 商人需要的货币类型
    this.currencyType = Math.random() < 0.3 ? 'valuable_item' : 'metal';
  }
  
  // 初始化海盗属性
  initializePirateAttributes() {
    // 海盗可能掉落的物品
    this.loot = [
      { type: 'metal', amount: Math.floor(Math.random() * 5) + 1 },
      { type: 'rope', amount: Math.floor(Math.random() * 3) + 1 }
    ];
    
    // 15%概率掉落稀有物品
    if (Math.random() < 0.15) {
      this.loot.push({
        type: 'pirate_treasure',
        amount: 1,
        isRare: true
      });
    }
    
    // 海盗武器和伤害
    this.damage = Math.floor(Math.random() * 5) + 8;
    this.attackRange = 70;
    this.attackCooldown = 3000; // 攻击冷却时间 (ms)
    this.lastAttackTime = 0;
    
    // 海盗巡逻行为
    this.patrolTimer = 0;
    this.targetPlayer = null;
  }
  
  // 更新NPC状态
  update(deltaTime) {
    if (this.type === 'trader') {
      this.updateTrader(deltaTime);
    } else if (this.type === 'pirate') {
      this.updatePirate(deltaTime);
    }
  }
  
  // 更新商人
  updateTrader(deltaTime) {
    switch (this.state) {
      case 'idle':
        // 有一定概率开始移动
        if (Math.random() < 0.01) {
          this.state = 'moving';
          this.setRandomDirection();
          this.moveTimer = Math.floor(Math.random() * 10) + 5; // 移动5-15秒
        }
        break;
        
      case 'moving':
        // 移动商人
        this.position.x += this.direction.x * this.speed * (deltaTime / 1000);
        this.position.y += this.direction.y * this.speed * (deltaTime / 1000);
        
        // 确保不会移出游戏区域
        this.constrainToGameArea();
        
        // 更新移动计时器
        this.moveTimer -= deltaTime / 1000;
        if (this.moveTimer <= 0) {
          this.state = 'idle';
        }
        break;
        
      case 'trading':
        // 交易状态下不移动
        break;
    }
  }
  
  // 更新海盗
  updatePirate(deltaTime) {
    switch (this.state) {
      case 'idle':
        // 海盗巡逻状态
        this.patrolTimer += deltaTime / 1000;
        
        if (this.patrolTimer >= 8) {
          this.patrolTimer = 0;
          this.setRandomDirection();
        }
        
        // 缓慢移动
        this.position.x += this.direction.x * (this.speed * 0.4) * (deltaTime / 1000);
        this.position.y += this.direction.y * (this.speed * 0.4) * (deltaTime / 1000);
        
        // 确保不会移出游戏区域
        this.constrainToGameArea();
        
        // 检查附近是否有玩家
        this.checkForPlayers();
        break;
        
      case 'attacking':
        if (!this.targetPlayer || !this.gameRoom.isPlayerActive(this.targetPlayer.socketId)) {
          this.state = 'idle';
          this.targetPlayer = null;
          break;
        }
        
        // 向目标移动
        const dx = this.targetPlayer.position.x - this.position.x;
        const dy = this.targetPlayer.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算方向向量
        this.direction = {
          x: dx / distance,
          y: dy / distance
        };
        
        // 向玩家移动
        this.position.x += this.direction.x * this.speed * (deltaTime / 1000);
        this.position.y += this.direction.y * this.speed * (deltaTime / 1000);
        
        // 如果够近，攻击玩家
        if (distance < this.attackRange) {
          this.attackPlayer();
        }
        
        // 如果距离过远，放弃追击
        if (distance > 500) {
          this.state = 'idle';
          this.targetPlayer = null;
        }
        break;
    }
  }
  
  // 检查附近是否有玩家 (海盗行为)
  checkForPlayers() {
    // 获取游戏房间中的所有玩家
    const players = this.gameRoom.getActivePlayers();
    let closestPlayer = null;
    let minDistance = 250; // 检测范围
    
    for (const player of players) {
      // 计算与玩家的距离
      const distance = Math.sqrt(
        Math.pow(this.position.x - player.position.x, 2) + 
        Math.pow(this.position.y - player.position.y, 2)
      );
      
      // 如果有玩家在检测范围内且距离更近
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    }
    
    // 如果找到目标，切换到攻击模式
    if (closestPlayer) {
      this.targetPlayer = closestPlayer;
      this.state = 'attacking';
      
      // 广播海盗发现玩家消息
      this.gameRoom.io.to(this.gameRoom.id).emit('pirate:spotted', {
        pirateId: this.id,
        targetId: closestPlayer.socketId,
        targetName: closestPlayer.nickname
      });
    }
  }
  
  // 攻击玩家 (海盗行为)
  attackPlayer() {
    const now = Date.now();
    
    // 检查攻击冷却
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    this.lastAttackTime = now;
    
    // 通知游戏房间海盗攻击事件
    this.gameRoom.onPirateAttack(this, this.targetPlayer, this.damage);
  }
  
  // 设置随机移动方向
  setRandomDirection() {
    const angle = Math.random() * 2 * Math.PI;
    this.direction = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }
  
  // 确保NPC不会移出游戏区域
  constrainToGameArea() {
    const GAME_BOUNDS = this.gameRoom.settings.gameAreaSize - 100;
    
    if (Math.abs(this.position.x) > GAME_BOUNDS) {
      this.position.x = Math.sign(this.position.x) * GAME_BOUNDS;
      this.direction.x *= -1;
    }
    
    if (Math.abs(this.position.y) > GAME_BOUNDS) {
      this.position.y = Math.sign(this.position.y) * GAME_BOUNDS;
      this.direction.y *= -1;
    }
  }
  
  // 玩家与NPC互动
  interact(player) {
    // 检查互动冷却
    const now = Date.now();
    if (now - this.lastInteractionTime < this.interactionCooldown) {
      return {
        success: false,
        message: "此NPC暂时无法互动，请稍后再试"
      };
    }
    
    // 检查距离
    const distance = Math.sqrt(
      Math.pow(this.position.x - player.position.x, 2) +
      Math.pow(this.position.y - player.position.y, 2)
    );
    
    if (distance > 100) {
      return {
        success: false,
        message: "距离太远，无法互动"
      };
    }
    
    // 根据NPC类型处理互动
    if (this.type === 'trader') {
      this.state = 'trading';
      this.lastInteractionTime = now;
      
      return {
        success: true,
        message: "与商人开始交易",
        npcType: this.type,
        inventory: this.inventory,
        currencyType: this.currencyType
      };
    } else if (this.type === 'pirate') {
      // 与海盗互动 (可能是试图贿赂或攻击)
      return {
        success: true,
        message: "与海盗互动",
        npcType: this.type,
        options: ["attack", "bribe"]
      };
    }
    
    return {
      success: false,
      message: "无效的NPC类型"
    };
  }
  
  // 交易物品 (商人)
  tradeItem(player, itemIndex, quantity) {
    if (this.type !== 'trader' || this.state !== 'trading') {
      return {
        success: false,
        message: "此NPC不是商人或当前不在交易状态"
      };
    }
    
    // 检查物品是否存在
    if (itemIndex < 0 || itemIndex >= this.inventory.length) {
      return {
        success: false,
        message: "物品不存在"
      };
    }
    
    const item = this.inventory[itemIndex];
    
    // 检查库存数量
    if (item.quantity < quantity) {
      return {
        success: false,
        message: "商人库存不足"
      };
    }
    
    // 计算总价
    const totalPrice = item.price * quantity;
    
    // TODO: 检查玩家是否有足够的货币
    // 需要实现玩家资源检查逻辑
    
    // 更新商人库存
    item.quantity -= quantity;
    
    // 如果库存为0，从列表中移除
    if (item.quantity <= 0) {
      this.inventory.splice(itemIndex, 1);
    }
    
    return {
      success: true,
      message: `成功购买 ${quantity} 个 ${item.type}`,
      item: {
        type: item.type,
        quantity: quantity,
        price: totalPrice
      }
    };
  }
  
  // 贿赂海盗
  bribePirate(player, resourceType, amount) {
    if (this.type !== 'pirate') {
      return {
        success: false,
        message: "此NPC不是海盗"
      };
    }
    
    // 检查贿赂量是否足够
    const minimumBribe = 5;
    if (amount < minimumBribe) {
      return {
        success: false,
        message: "贿赂不够，海盗不满意",
        minimumRequired: minimumBribe
      };
    }
    
    // TODO: 检查玩家是否有足够的资源
    // 需要实现玩家资源检查逻辑
    
    // 海盗暂时变为友好状态
    this.state = 'idle';
    if (this.targetPlayer && this.targetPlayer.socketId === player.socketId) {
      this.targetPlayer = null;
    }
    
    // 设置互动冷却时间
    this.lastInteractionTime = Date.now();
    this.interactionCooldown = 300000; // 5分钟内不会再攻击此玩家
    
    return {
      success: true,
      message: "海盗接受了你的贿赂，暂时不会攻击你",
      safeTime: "5分钟"
    };
  }
  
  // 海盗被击败
  onDefeated() {
    if (this.type !== 'pirate') return;
    
    // 广播海盗被击败消息
    this.gameRoom.io.to(this.gameRoom.id).emit('pirate:defeated', {
      pirateId: this.id,
      position: this.position,
      loot: this.loot
    });
    
    // 从游戏中移除海盗
    this.gameRoom.removeNPC(this.id);
    
    return this.loot;
  }
  
  // 当海盗受到攻击
  takeDamage(damage) {
    this.health -= damage;
    
    // 广播海盗受伤消息
    this.gameRoom.io.to(this.gameRoom.id).emit('pirate:damaged', {
      pirateId: this.id,
      damage: damage,
      remainingHealth: this.health
    });
    
    // 检查是否被击败
    if (this.health <= 0) {
      return this.onDefeated();
    }
    
    return null;
  }
  
  // 获取NPC数据 (用于客户端显示)
  getClientData() {
    const data = {
      id: this.id,
      type: this.type,
      position: this.position,
      state: this.state
    };
    
    if (this.type === 'pirate') {
      data.health = this.health;
    }
    
    return data;
  }
}

module.exports = NPC; 