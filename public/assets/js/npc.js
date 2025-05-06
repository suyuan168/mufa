/**
 * NPC管理模块 - 客户端
 * 处理商人和海盗等NPC的渲染和交互
 */
class NPCManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    this.camera = game.camera;
    
    // NPC集合
    this.npcs = new Map();
    
    // NPC图像
    this.images = {};
    this.loadImages();
    
    // 动画帧
    this.animations = {};
    this.loadAnimations();
    
    // 音效
    this.sounds = {};
    this.loadSounds();
    
    // 当前交互中的NPC
    this.activeNPC = null;
    
    // 是否显示NPC交互范围
    this.showInteractionRadius = true;
    
    // NPC互动范围
    this.interactionRadius = 100;
    
    // 初始化事件监听
    this.initEventListeners();
  }
  
  // 加载NPC图像
  loadImages() {
    const imageList = {
      'trader': '/assets/images/entities/trader.png',
      'pirate': '/assets/images/entities/pirate.png',
      'trader_idle': '/assets/images/entities/trader_idle.png',
      'pirate_idle': '/assets/images/entities/pirate_idle.png',
      'trader_boat': '/assets/images/entities/trader_boat.png',
      'pirate_boat': '/assets/images/entities/pirate_boat.png'
    };
    
    for (const [key, src] of Object.entries(imageList)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  }
  
  // 加载动画帧数据
  loadAnimations() {
    // 简单的帧动画数据
    this.animations = {
      'trader_idle': {
        frames: 4,
        frameWidth: 64,
        frameHeight: 64,
        frameDuration: 250, // 每帧时长(毫秒)
      },
      'pirate_idle': {
        frames: 4,
        frameWidth: 64,
        frameHeight: 64,
        frameDuration: 200,
      },
      'trader_move': {
        frames: 6,
        frameWidth: 64,
        frameHeight: 64,
        frameDuration: 150,
      },
      'pirate_move': {
        frames: 6,
        frameWidth: 64,
        frameHeight: 64,
        frameDuration: 120,
      }
    };
  }
  
  // 加载音效
  loadSounds() {
    const soundList = {
      'trader_hello': '/assets/audio/fx/trader_hello.mp3',
      'pirate_spotted': '/assets/audio/fx/pirate_spotted.mp3',
      'pirate_attack': '/assets/audio/fx/pirate_attack.mp3',
      'trade_success': '/assets/audio/fx/trade_success.mp3'
    };
    
    for (const [key, src] of Object.entries(soundList)) {
      const sound = new Audio(src);
      sound.volume = 0.5;
      this.sounds[key] = sound;
    }
  }
  
  // 初始化事件监听
  initEventListeners() {
    // 监听NPC生成事件
    this.game.socket.on('npc:spawn', data => {
      this.addNPC(data);
    });
    
    // 监听海盗发现玩家事件
    this.game.socket.on('pirate:spotted', data => {
      this.onPirateSpotted(data);
    });
    
    // 监听海盗攻击事件
    this.game.socket.on('pirate:attack', data => {
      this.onPirateAttack(data);
    });
    
    // 监听海盗受伤事件
    this.game.socket.on('pirate:damaged', data => {
      this.onPirateDamaged(data);
    });
    
    // 监听海盗死亡事件
    this.game.socket.on('pirate:defeated', data => {
      this.onPirateDefeated(data);
    });
    
    // 监听交互按钮点击
    this.game.ui.on('npc:interact', () => {
      this.interactWithNPC();
    });
    
    // 监听交易确认按钮点击
    this.game.ui.on('trade:confirm', (itemIndex, quantity) => {
      this.tradeWithNPC(itemIndex, quantity);
    });
    
    // 监听攻击海盗按钮点击
    this.game.ui.on('pirate:attack', () => {
      this.attackPirate();
    });
    
    // 监听贿赂海盗按钮点击
    this.game.ui.on('pirate:bribe', (resourceType, amount) => {
      this.bribePirate(resourceType, amount);
    });
  }
  
  // 添加NPC
  addNPC(npcData) {
    this.npcs.set(npcData.id, {
      id: npcData.id,
      type: npcData.type,
      position: npcData.position,
      state: npcData.state || 'idle',
      health: npcData.health,
      direction: { x: 0, y: 0 },
      lastFrameTime: 0,
      currentFrame: 0,
      visible: true,
      // 视觉效果参数
      effects: {
        bobOffset: Math.random() * Math.PI * 2, // 随机起始相位
        bobSpeed: 0.5 + Math.random() * 0.5,
        bobHeight: 3 + Math.random() * 2,
        scale: 0.95 + Math.random() * 0.1
      },
      damageFeedback: { // 伤害反馈效果
        active: false,
        duration: 300,
        startTime: 0
      }
    });
    
    console.log(`NPC添加: ${npcData.type} (${npcData.id})`);
  }
  
  // 海盗发现玩家事件处理
  onPirateSpotted(data) {
    if (!this.npcs.has(data.pirateId)) return;
    
    const npc = this.npcs.get(data.pirateId);
    npc.state = 'attacking';
    npc.targetId = data.targetId;
    
    // 如果海盗发现的是当前玩家，播放警告音效并显示通知
    if (data.targetId === this.game.playerId) {
      if (this.sounds.pirate_spotted) {
        this.sounds.pirate_spotted.currentTime = 0;
        this.sounds.pirate_spotted.play();
      }
      
      this.game.ui.showNotification('警告！海盗发现了你！', 'danger');
    } else {
      // 其他玩家被发现
      this.game.ui.showNotification(`海盗正在攻击 ${data.targetName}`);
    }
  }
  
  // 海盗攻击事件处理
  onPirateAttack(data) {
    if (!this.npcs.has(data.pirateId)) return;
    
    // 如果攻击目标是当前玩家，播放攻击音效
    if (data.targetId === this.game.playerId) {
      if (this.sounds.pirate_attack) {
        this.sounds.pirate_attack.currentTime = 0;
        this.sounds.pirate_attack.play();
      }
      
      this.game.ui.showNotification(`海盗攻击了你的木筏！-${data.damage}`, 'damage');
      
      // 触发屏幕震动效果
      this.game.camera.shake(300, 5);
    }
  }
  
  // 海盗受伤事件处理
  onPirateDamaged(data) {
    if (!this.npcs.has(data.pirateId)) return;
    
    const npc = this.npcs.get(data.pirateId);
    npc.health = data.remainingHealth;
    
    // 添加受伤视觉反馈
    npc.damageFeedback = {
      active: true,
      duration: 300,
      startTime: performance.now()
    };
    
    // 如果是当前玩家造成的伤害，显示伤害数字
    if (data.attackerId === this.game.playerId) {
      this.game.ui.showDamageNumber(data.damage, npc.position);
    }
  }
  
  // 海盗被击败事件处理
  onPirateDefeated(data) {
    if (!this.npcs.has(data.pirateId)) return;
    
    const npc = this.npcs.get(data.pirateId);
    
    // 显示战利品通知
    if (data.loot && data.loot.length > 0) {
      this.game.ui.showNotification('你击败了海盗！获得战利品：');
      this.game.ui.showLootNotification(data.loot);
      
      // 更新玩家库存
      this.game.updateInventory(data.loot);
    }
    
    // 移除海盗NPC
    this.npcs.delete(data.pirateId);
  }
  
  // 与NPC互动
  interactWithNPC() {
    if (!this.activeNPC) return;
    
    // 发送互动请求到服务器
    this.game.socket.emit('npc:interact', {
      npcId: this.activeNPC
    }, response => {
      this.handleInteractionResponse(response);
    });
  }
  
  // 与商人交易
  tradeWithNPC(itemIndex, quantity) {
    if (!this.activeNPC) return;
    
    // 发送交易请求到服务器
    this.game.socket.emit('npc:trade', {
      npcId: this.activeNPC,
      itemIndex,
      quantity
    }, response => {
      this.handleTradeResponse(response);
    });
  }
  
  // 攻击海盗
  attackPirate() {
    if (!this.activeNPC) return;
    
    const npc = this.npcs.get(this.activeNPC);
    if (npc.type !== 'pirate') return;
    
    // 计算玩家攻击伤害
    const damage = this.game.calculateAttackDamage();
    
    // 发送攻击请求到服务器
    this.game.socket.emit('pirate:attack', {
      pirateId: this.activeNPC,
      damage
    }, response => {
      this.handleAttackResponse(response);
    });
  }
  
  // 贿赂海盗
  bribePirate(resourceType, amount) {
    if (!this.activeNPC) return;
    
    // 发送贿赂请求到服务器
    this.game.socket.emit('pirate:bribe', {
      pirateId: this.activeNPC,
      resourceType,
      amount
    }, response => {
      this.handleBribeResponse(response);
    });
  }
  
  // 处理NPC互动响应
  handleInteractionResponse(response) {
    if (!response.success) {
      // 互动失败
      this.game.ui.showNotification(response.message);
      return;
    }
    
    // 互动成功
    if (response.npcType === 'trader') {
      // 播放商人问候音效
      if (this.sounds.trader_hello) {
        this.sounds.trader_hello.currentTime = 0;
        this.sounds.trader_hello.play();
      }
      
      // 显示交易界面
      this.game.ui.showTradeMenu(response.inventory, response.currencyType);
    } else if (response.npcType === 'pirate') {
      // 显示海盗互动选项
      this.game.ui.showPirateInteractionMenu(response.options);
    }
  }
  
  // 处理交易响应
  handleTradeResponse(response) {
    if (!response.success) {
      // 交易失败
      this.game.ui.showNotification(response.message, 'warning');
      return;
    }
    
    // 交易成功
    this.game.ui.showNotification(response.message, 'success');
    
    // 播放交易成功音效
    if (this.sounds.trade_success) {
      this.sounds.trade_success.currentTime = 0;
      this.sounds.trade_success.play();
    }
    
    // 更新玩家库存
    this.game.updateInventory([response.item], true);
    
    // 关闭交易菜单
    this.game.ui.closeTradeMenu();
  }
  
  // 处理攻击响应
  handleAttackResponse(response) {
    if (!response.success) {
      // 攻击失败
      this.game.ui.showNotification(response.message, 'warning');
      return;
    }
    
    // 攻击成功
    if (response.loot) {
      // 海盗被击败
      this.game.ui.showNotification(response.message, 'success');
      this.game.ui.showLootNotification(response.loot);
      
      // 更新玩家库存
      this.game.updateInventory(response.loot);
    } else {
      // 海盗受伤但未被击败
      this.game.ui.showNotification(response.message);
    }
  }
  
  // 处理贿赂响应
  handleBribeResponse(response) {
    if (!response.success) {
      // 贿赂失败
      this.game.ui.showNotification(response.message, 'warning');
      return;
    }
    
    // 贿赂成功
    this.game.ui.showNotification(response.message, 'success');
    
    // 关闭海盗互动菜单
    this.game.ui.closePirateInteractionMenu();
  }
  
  // 更新所有NPC
  update(deltaTime) {
    for (const [id, npc] of this.npcs.entries()) {
      // 更新动画
      this.updateNPCAnimation(npc, deltaTime);
      
      // 更新伤害反馈效果
      if (npc.damageFeedback.active) {
        const elapsed = performance.now() - npc.damageFeedback.startTime;
        if (elapsed >= npc.damageFeedback.duration) {
          npc.damageFeedback.active = false;
        }
      }
    }
    
    // 计算是否有可互动的NPC
    this.updateActiveNPC();
  }
  
  // 更新NPC动画
  updateNPCAnimation(npc, deltaTime) {
    // 浮动动画 (船只上下摇晃)
    npc.bobOffset = Math.sin((performance.now() * 0.001 * npc.effects.bobSpeed) + npc.effects.bobOffset) * npc.effects.bobHeight;
    
    // 帧动画
    const animationKey = `${npc.type}_${npc.state === 'idle' ? 'idle' : 'move'}`;
    const animation = this.animations[animationKey];
    
    if (animation) {
      const now = performance.now();
      const elapsed = now - npc.lastFrameTime;
      
      if (elapsed > animation.frameDuration) {
        npc.currentFrame = (npc.currentFrame + 1) % animation.frames;
        npc.lastFrameTime = now;
      }
    }
  }
  
  // 更新当前可互动的NPC
  updateActiveNPC() {
    let closestNPC = null;
    let minDistance = Infinity;
    
    const player = this.game.player;
    if (!player || !player.position) {
      this.activeNPC = null;
      return;
    }
    
    // 查找最近的可互动NPC
    for (const [id, npc] of this.npcs.entries()) {
      // 计算与玩家的距离
      const dx = npc.position.x - player.position.x;
      const dy = npc.position.y - player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 检查是否在互动范围内
      if (distance <= this.interactionRadius && distance < minDistance) {
        closestNPC = id;
        minDistance = distance;
      }
    }
    
    // 更新当前可互动NPC
    if (this.activeNPC !== closestNPC) {
      this.activeNPC = closestNPC;
      
      // 通知UI更新互动按钮状态
      if (this.activeNPC) {
        const npc = this.npcs.get(this.activeNPC);
        this.game.ui.showNPCInteractButton(npc.type);
      } else {
        this.game.ui.hideNPCInteractButton();
      }
    }
  }
  
  // 渲染所有NPC
  render() {
    this.ctx.save();
    
    // 应用相机变换
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // 获取当前时间（用于闪烁等效果）
    const time = performance.now();
    
    // 渲染所有NPC
    for (const [id, npc] of this.npcs.entries()) {
      // 计算屏幕坐标
      const screenX = npc.position.x;
      const screenY = npc.position.y + npc.bobOffset; // 添加浮动动画
      
      // 绘制NPC互动范围（仅当激活或开启显示时）
      if (this.activeNPC === id || this.showInteractionRadius) {
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, this.interactionRadius, 0, Math.PI * 2);
        
        // 如果是活跃NPC，使用高亮颜色
        if (this.activeNPC === id) {
          this.ctx.strokeStyle = npc.type === 'pirate' ? 'rgba(255, 100, 100, 0.7)' : 'rgba(100, 255, 100, 0.7)';
          this.ctx.lineWidth = 3;
        } else {
          this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
          this.ctx.lineWidth = 1.5;
        }
        
        this.ctx.stroke();
      }
      
      // 绘制船只阴影
      this.ctx.beginPath();
      this.ctx.ellipse(screenX, screenY + 30, 40, 10, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fill();
      
      // 绘制船只
      const boatImage = this.images[`${npc.type}_boat`];
      if (boatImage && boatImage.complete) {
        this.ctx.drawImage(boatImage, screenX - 50, screenY - 20, 100, 50);
      }
      
      // 应用NPC特效
      this.ctx.save();
      this.ctx.translate(screenX, screenY - 30); // NPC站在船上的位置
      
      // 如果NPC受到伤害，添加红色闪烁效果
      if (npc.damageFeedback.active) {
        const elapsed = time - npc.damageFeedback.startTime;
        const flashIntensity = 1 - (elapsed / npc.damageFeedback.duration);
        this.ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity * 0.5})`;
        this.ctx.fillRect(-30, -40, 60, 60);
      }
      
      // 绘制NPC
      const animationKey = `${npc.type}_${npc.state === 'idle' ? 'idle' : 'move'}`;
      const animation = this.animations[animationKey];
      const image = this.images[animationKey] || this.images[npc.type];
      
      if (image && image.complete && animation) {
        // 绘制帧动画
        const frameX = npc.currentFrame * animation.frameWidth;
        this.ctx.drawImage(
          image,
          frameX, 0, animation.frameWidth, animation.frameHeight,
          -30, -40, 60, 60
        );
      } else if (image && image.complete) {
        // 没有动画数据，直接绘制整张图片
        this.ctx.drawImage(image, -30, -40, 60, 60);
      }
      
      // 如果是海盗，绘制生命条
      if (npc.type === 'pirate' && typeof npc.health === 'number') {
        const healthPercentage = Math.max(0, npc.health / 100);
        
        // 血条底框
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(-25, -50, 50, 6);
        
        // 血条
        this.ctx.fillStyle = `rgb(${255 - healthPercentage * 255}, ${healthPercentage * 255}, 0)`;
        this.ctx.fillRect(-25, -50, 50 * healthPercentage, 6);
      }
      
      this.ctx.restore(); // 恢复NPC特效的变换
      
      // 绘制NPC类型文本
      const npcTypeText = npc.type === 'trader' ? '商人' : '海盗';
      this.ctx.font = 'bold 12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      
      // 文字阴影
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillText(npcTypeText, screenX + 1, screenY - 45 + 1);
      
      // 文字本体
      this.ctx.fillStyle = npc.type === 'trader' ? 'rgba(100, 255, 100, 0.9)' : 'rgba(255, 100, 100, 0.9)';
      this.ctx.fillText(npcTypeText, screenX, screenY - 45);
      
      // 如果是海盗且处于攻击状态，绘制警告标志
      if (npc.type === 'pirate' && npc.state === 'attacking') {
        const warningSize = 15 + Math.sin(time * 0.01) * 3; // 闪烁效果
        
        this.ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY - 70);
        this.ctx.lineTo(screenX - warningSize, screenY - 70 - warningSize * 1.5);
        this.ctx.lineTo(screenX + warningSize, screenY - 70 - warningSize * 1.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('!', screenX, screenY - 70 - warningSize * 0.5);
      }
    }
    
    this.ctx.restore();
  }
  
  // 清理资源
  cleanup() {
    for (const sound of Object.values(this.sounds)) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

// 导出模块
export default NPCManager; 