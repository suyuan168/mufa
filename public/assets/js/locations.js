/**
 * 位置管理模块 - 客户端
 * 处理岛屿、沉船等探索位置的渲染和交互
 */
class LocationManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    this.camera = game.camera;
    
    // 位置集合
    this.locations = new Map();
    
    // 位置图像
    this.images = {};
    this.loadImages();
    
    // 资源图标
    this.resourceIcons = {};
    this.loadResourceIcons();
    
    // 音效
    this.sounds = {};
    this.loadSounds();
    
    // 当前交互中的位置
    this.activeLocation = null;
    
    // 位置交互范围显示
    this.showInteractionRadius = true;
    
    // 发现新位置的动画状态
    this.discoveryAnimation = {
      active: false,
      locationId: null,
      progress: 0,
      duration: 2000,
      startTime: 0
    };
    
    // 初始化事件监听
    this.initEventListeners();
  }
  
  // 加载位置图像
  loadImages() {
    const imageList = {
      'island': '/assets/images/environments/island.png',
      'shipwreck': '/assets/images/environments/shipwreck.png',
      'floatingcrate': '/assets/images/environments/crate.png',
      'abandonedraft': '/assets/images/environments/abandoned_raft.png',
      'researchstation': '/assets/images/environments/research_station.png',
      'island_night': '/assets/images/environments/island_night.png',
      'shipwreck_night': '/assets/images/environments/shipwreck_night.png'
    };
    
    for (const [key, src] of Object.entries(imageList)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  }
  
  // 加载资源图标
  loadResourceIcons() {
    const iconList = {
      'wood': '/assets/images/items/wood.png',
      'plastic': '/assets/images/items/plastic.png',
      'metal': '/assets/images/items/metal.png',
      'food': '/assets/images/items/food.png',
      'water': '/assets/images/items/water.png',
      'leaf': '/assets/images/items/leaf.png',
      'rare_item': '/assets/images/items/rare_item.png',
      'treasure': '/assets/images/items/treasure.png'
    };
    
    for (const [key, src] of Object.entries(iconList)) {
      const img = new Image();
      img.src = src;
      this.resourceIcons[key] = img;
    }
  }
  
  // 加载音效
  loadSounds() {
    const soundList = {
      'discover': '/assets/audio/fx/discover.mp3',
      'collect': '/assets/audio/fx/collect.mp3',
      'open_chest': '/assets/audio/fx/chest_open.mp3'
    };
    
    for (const [key, src] of Object.entries(soundList)) {
      const sound = new Audio(src);
      sound.volume = 0.5;
      this.sounds[key] = sound;
    }
  }
  
  // 初始化事件监听
  initEventListeners() {
    // 监听位置生成事件
    this.game.socket.on('location:spawn', data => {
      this.addLocation(data);
    });
    
    // 监听位置耗尽事件
    this.game.socket.on('location:depleted', data => {
      this.markLocationDepleted(data.locationId);
    });
    
    // 监听位置被发现事件
    this.game.socket.on('location:discovered', data => {
      this.onLocationDiscovered(data);
    });
    
    // 监听交互按钮点击
    this.game.ui.on('interact', () => {
      this.interactWithLocation();
    });
  }
  
  // 添加位置
  addLocation(locationData) {
    this.locations.set(locationData.id, {
      id: locationData.id,
      type: locationData.type,
      position: locationData.position,
      size: locationData.size || 100,
      depleted: locationData.depleted || false,
      puzzleSolved: locationData.puzzleSolved || false,
      name: locationData.name || this.getLocationTypeName(locationData.type),
      discovered: false,
      visible: this.isLocationVisible(locationData.position),
      animationOffset: 0,
      // 位置特有的视觉效果参数
      effects: {
        bobOffset: Math.random() * Math.PI * 2, // 随机起始相位，使每个位置的浮动不同步
        bobSpeed: 0.5 + Math.random() * 0.5,    // 随机浮动速度
        rotationOffset: (Math.random() - 0.5) * 0.1, // 随机微小倾斜
        scale: 0.95 + Math.random() * 0.1       // 随机微小缩放变化
      }
    });
    
    console.log(`位置添加: ${locationData.type} (${locationData.id})`);
  }
  
  // 标记位置为已耗尽
  markLocationDepleted(locationId) {
    if (this.locations.has(locationId)) {
      const location = this.locations.get(locationId);
      location.depleted = true;
      
      // 在UI中显示通知
      this.game.ui.showNotification(`${location.name}的资源已耗尽`);
    }
  }
  
  // 位置被发现事件处理
  onLocationDiscovered(data) {
    if (!this.locations.has(data.locationId)) return;
    
    const location = this.locations.get(data.locationId);
    location.discovered = true;
    
    // 如果是当前玩家发现的，播放发现动画
    if (data.playerId === this.game.playerId) {
      // 播放发现音效
      if (this.sounds.discover) {
        this.sounds.discover.currentTime = 0;
        this.sounds.discover.play();
      }
      
      // 设置发现动画
      this.discoveryAnimation = {
        active: true,
        locationId: data.locationId,
        progress: 0,
        startTime: performance.now(),
        duration: 2000
      };
      
      // 在UI中显示通知
      this.game.ui.showNotification(`发现了${location.name}！`);
    } else {
      // 其他玩家发现的，显示信息
      this.game.ui.showNotification(`${data.playerName}发现了${location.name}`);
    }
  }
  
  // 与位置互动
  interactWithLocation() {
    if (!this.activeLocation) return;
    
    // 发送互动请求到服务器
    this.game.socket.emit('location:interact', {
      locationId: this.activeLocation
    }, response => {
      this.handleInteractionResponse(response);
    });
  }
  
  // 处理位置互动响应
  handleInteractionResponse(response) {
    if (!response.success) {
      // 互动失败
      this.game.ui.showNotification(response.message);
      return;
    }
    
    // 互动成功
    this.game.ui.showNotification(response.message);
    
    // 如果获得了资源，显示资源并播放音效
    if (response.loot && response.loot.length > 0) {
      // 播放收集音效
      if (this.sounds.collect) {
        this.sounds.collect.currentTime = 0;
        this.sounds.collect.play();
      }
      
      // 如果有宝箱，播放特殊音效
      if (response.loot.some(item => item.type.includes('treasure'))) {
        if (this.sounds.open_chest) {
          this.sounds.open_chest.currentTime = 0;
          this.sounds.open_chest.play();
        }
      }
      
      // 显示获得的资源
      this.game.ui.showLootNotification(response.loot);
      
      // 更新玩家库存
      this.game.updateInventory(response.loot);
    }
    
    // 如果位置已耗尽
    if (!response.remainingCapacity) {
      this.markLocationDepleted(this.activeLocation);
    }
  }
  
  // 获取位置类型名称
  getLocationTypeName(type) {
    const names = {
      'island': '小岛',
      'shipwreck': '沉船',
      'floatingcrate': '漂浮箱',
      'abandonedraft': '废弃木筏',
      'researchstation': '研究站'
    };
    
    return names[type] || '未知地点';
  }
  
  // 检查位置是否在视野范围内
  isLocationVisible(position) {
    // 计算位置与玩家的距离
    const player = this.game.player;
    if (!player || !player.position) return false;
    
    const dx = position.x - player.position.x;
    const dy = position.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 检查是否在视距内（受天气和时间影响）
    const baseVisibility = 1200; // 基础可见距离
    let visibilityMultiplier = 1.0;
    
    // 如果天气系统存在，考虑天气对可见度的影响
    if (this.game.weather) {
      // 根据天气和时间调整可见度
      if (this.game.weather.weatherEffects && this.game.weather.weatherEffects.visibility) {
        visibilityMultiplier *= this.game.weather.weatherEffects.visibility;
      }
      
      // 根据时间阶段调整可见度
      if (this.game.weather.currentTimePhase === 'night') {
        visibilityMultiplier *= 0.4; // 夜晚可见度降低
      } else if (this.game.weather.currentTimePhase === 'dawn' || this.game.weather.currentTimePhase === 'dusk') {
        visibilityMultiplier *= 0.7; // 黎明/黄昏可见度略降
      }
    }
    
    const visibilityRange = baseVisibility * visibilityMultiplier;
    return distance <= visibilityRange;
  }
  
  // 更新所有位置
  update(deltaTime) {
    // 更新位置可见性
    for (const [id, location] of this.locations.entries()) {
      location.visible = this.isLocationVisible(location.position);
      
      // 更新动画偏移
      location.effects.animationTime = (location.effects.animationTime || 0) + deltaTime;
      location.animationOffset = Math.sin(location.effects.animationTime * 0.001 * location.effects.bobSpeed + location.effects.bobOffset) * 5;
    }
    
    // 更新发现动画
    if (this.discoveryAnimation.active) {
      const elapsed = performance.now() - this.discoveryAnimation.startTime;
      this.discoveryAnimation.progress = Math.min(1, elapsed / this.discoveryAnimation.duration);
      
      if (this.discoveryAnimation.progress >= 1) {
        this.discoveryAnimation.active = false;
      }
    }
    
    // 计算是否有可互动的位置
    this.updateActiveLocation();
  }
  
  // 更新当前可互动的位置
  updateActiveLocation() {
    let closestLocation = null;
    let minDistance = Infinity;
    
    const player = this.game.player;
    if (!player || !player.position) {
      this.activeLocation = null;
      return;
    }
    
    // 查找最近的可互动位置
    for (const [id, location] of this.locations.entries()) {
      if (location.depleted) continue; // 忽略已耗尽的位置
      
      // 计算与玩家的距离
      const dx = location.position.x - player.position.x;
      const dy = location.position.y - player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 检查是否在互动范围内
      if (distance <= location.size && distance < minDistance) {
        closestLocation = id;
        minDistance = distance;
      }
    }
    
    // 更新当前可互动位置
    if (this.activeLocation !== closestLocation) {
      this.activeLocation = closestLocation;
      
      // 通知UI更新互动按钮状态
      if (this.activeLocation) {
        const location = this.locations.get(this.activeLocation);
        this.game.ui.showInteractButton(location.name);
      } else {
        this.game.ui.hideInteractButton();
      }
    }
  }
  
  // 渲染所有位置
  render() {
    this.ctx.save();
    
    // 应用相机变换
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // 获取当前时间和天气
    const isNight = this.game.weather && this.game.weather.currentTimePhase === 'night';
    
    // 渲染所有可见位置
    for (const [id, location] of this.locations.entries()) {
      if (!location.visible) continue;
      
      // 决定使用哪个图像
      let imageName = location.type;
      if (isNight && this.images[`${location.type}_night`]) {
        imageName = `${location.type}_night`;
      }
      
      const image = this.images[imageName];
      if (!image || !image.complete) continue;
      
      // 决定位置大小
      let size = location.type === 'island' ? 200 : 120;
      if (location.type === 'floatingcrate') size = 60;
      if (location.type === 'researchstation') size = 150;
      
      // 计算屏幕坐标
      const screenX = location.position.x;
      const screenY = location.position.y + location.animationOffset; // 添加浮动动画
      
      // 绘制位置互动范围（仅当激活或开启显示时）
      if ((this.activeLocation === id || this.showInteractionRadius) && !location.depleted) {
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, location.size, 0, Math.PI * 2);
        
        // 如果是活跃位置，使用高亮颜色
        if (this.activeLocation === id) {
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          this.ctx.lineWidth = 3;
        } else {
          this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
          this.ctx.lineWidth = 1.5;
        }
        
        this.ctx.stroke();
      }
      
      // 绘制阴影
      this.ctx.beginPath();
      this.ctx.ellipse(screenX, screenY + size * 0.4, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fill();
      
      // 应用位置特效
      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate(location.effects.rotationOffset);
      this.ctx.scale(location.effects.scale, location.effects.scale);
      
      // 如果位置已耗尽，使用灰度滤镜
      if (location.depleted) {
        this.ctx.filter = 'grayscale(90%)';
      }
      
      // 绘制位置图像
      this.ctx.drawImage(image, -size/2, -size/2, size, size);
      
      // 如果是夜晚，添加发光效果（对研究站等）
      if (isNight && (location.type === 'researchstation' || location.type === 'shipwreck')) {
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.beginPath();
        
        // 为不同类型的位置创建不同颜色的光
        let glowColor = 'rgba(255, 200, 100, 0.15)'; // 默认暖黄色
        if (location.type === 'researchstation') {
          glowColor = 'rgba(100, 200, 255, 0.2)'; // 蓝色
        }
        
        const gradient = this.ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
      }
      
      this.ctx.restore(); // 恢复位置特效的变换
      
      // 绘制位置名称（仅当玩家足够近或已发现）
      const playerDistance = Math.sqrt(
        Math.pow(location.position.x - this.game.player.position.x, 2) +
        Math.pow(location.position.y - this.game.player.position.y, 2)
      );
      
      if (location.discovered || playerDistance < 400) {
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // 文字阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText(location.name, screenX + 1, screenY - size/2 - 10 + 1);
        
        // 文字本体
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(location.name, screenX, screenY - size/2 - 10);
      }
      
      // 如果位置已耗尽，显示"已耗尽"标记
      if (location.depleted) {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
        this.ctx.fillText('已耗尽', screenX, screenY + size/2 + 15);
      }
    }
    
    // 绘制发现动画
    if (this.discoveryAnimation.active) {
      this.renderDiscoveryAnimation();
    }
    
    this.ctx.restore();
  }
  
  // 渲染位置发现动画
  renderDiscoveryAnimation() {
    const locationId = this.discoveryAnimation.locationId;
    if (!this.locations.has(locationId)) return;
    
    const location = this.locations.get(locationId);
    const progress = this.discoveryAnimation.progress;
    
    // 绘制从玩家到位置的连线
    this.ctx.save();
    
    const playerPos = this.game.player.position;
    const locationPos = location.position;
    
    // 创建渐变线
    const gradient = this.ctx.createLinearGradient(
      playerPos.x, playerPos.y,
      locationPos.x, locationPos.y
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(playerPos.x, playerPos.y);
    
    // 使用贝塞尔曲线创建弧形路径
    const controlPointX = (playerPos.x + locationPos.x) / 2;
    const controlPointY = (playerPos.y + locationPos.y) / 2 - 100;
    
    // 只绘制到当前进度
    const endX = playerPos.x + (locationPos.x - playerPos.x) * progress;
    const endY = playerPos.y + (locationPos.y - playerPos.y) * progress;
    
    this.ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY);
    this.ctx.stroke();
    
    // 在终点绘制光晕
    if (progress > 0.1) {
      const glowSize = 20 + Math.sin(progress * Math.PI * 4) * 10;
      const glowOpacity = (1 - progress) * 0.7;
      
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.fillStyle = `rgba(255, 255, 200, ${glowOpacity})`;
      this.ctx.beginPath();
      this.ctx.arc(endX, endY, glowSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 在位置上绘制发现效果
      if (progress > 0.95) {
        const locationGlow = this.ctx.createRadialGradient(
          locationPos.x, locationPos.y, 0,
          locationPos.x, locationPos.y, location.size * 1.2
        );
        locationGlow.addColorStop(0, 'rgba(255, 255, 200, 0.7)');
        locationGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        this.ctx.fillStyle = locationGlow;
        this.ctx.beginPath();
        this.ctx.arc(locationPos.x, locationPos.y, location.size * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.globalCompositeOperation = 'source-over';
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
export default LocationManager; 