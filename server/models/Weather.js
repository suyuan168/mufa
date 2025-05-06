/**
 * 天气系统
 * 管理游戏中的天气和环境效果
 */
class Weather {
  constructor(gameRoom) {
    this.gameRoom = gameRoom;
    this.currentWeather = 'clear'; // 默认天气：晴朗
    this.currentTime = 'day';      // 默认时间：白天
    this.timeOfDay = 0;            // 时间计数器 (0-1440分钟，表示一个游戏日)
    this.minutesPerRealSecond = 1; // 游戏时间流逝速度 (每现实秒对应的游戏分钟数)
    
    // 天气类型及其概率
    this.weatherTypes = {
      'clear': {
        duration: { min: 15, max: 30 }, // 持续时间 (游戏内分钟)
        probability: 0.6                // 出现概率
      },
      'cloudy': {
        duration: { min: 10, max: 20 },
        probability: 0.2,
        effects: {
          visibility: 0.9,              // 能见度影响
          resourceSpawnModifier: 1.0    // 资源生成影响
        }
      },
      'foggy': {
        duration: { min: 8, max: 15 },
        probability: 0.1,
        effects: {
          visibility: 0.5,
          resourceSpawnModifier: 0.8
        }
      },
      'storm': {
        duration: { min: 5, max: 12 },
        probability: 0.07,
        effects: {
          visibility: 0.4,
          resourceSpawnModifier: 1.5,   // 风暴后更多资源
          rareItemChance: 0.3,          // 稀有物品几率
          movementPenalty: 0.7          // 移动速度减益
        }
      },
      'heavyStorm': {
        duration: { min: 3, max: 8 },
        probability: 0.03,
        effects: {
          visibility: 0.2,
          resourceSpawnModifier: 2.0,
          rareItemChance: 0.5,
          movementPenalty: 0.5,
          raftDamage: 2              // 对木筏造成的持续伤害
        }
      }
    };
    
    // 游戏内时间系统
    this.timePhases = {
      'dawn': { start: 360, end: 480, visibility: 0.7 },    // 6:00-8:00
      'day': { start: 480, end: 1080, visibility: 1.0 },    // 8:00-18:00
      'dusk': { start: 1080, end: 1200, visibility: 0.7 },  // 18:00-20:00
      'night': { start: 1200, end: 360, visibility: 0.4 }   // 20:00-6:00
    };
    
    // 当前天气状态
    this.currentWeatherState = {
      type: 'clear',
      timeRemaining: 0,
      effects: {}
    };
    
    // 初始化天气
    this.initWeather();
  }
  
  // 初始化天气系统
  initWeather() {
    this.setRandomWeather();
    this.timeOfDay = 540; // 从上午9点开始
    this.updateTimePhase();
  }
  
  // 更新天气和时间
  update(deltaTime) {
    // 更新游戏内时间
    const realTimeSeconds = deltaTime / 1000;
    const gameMinutesPassed = realTimeSeconds * this.minutesPerRealSecond;
    
    this.timeOfDay = (this.timeOfDay + gameMinutesPassed) % 1440; // 1440 = 24小时 * 60分钟
    const previousPhase = this.currentTime;
    this.updateTimePhase();
    
    // 如果时间阶段发生变化，通知客户端
    if (previousPhase !== this.currentTime) {
      this.broadcastTimeChange();
    }
    
    // 更新当前天气状态
    this.currentWeatherState.timeRemaining -= gameMinutesPassed;
    
    // 如果当前天气持续时间结束，切换到新天气
    if (this.currentWeatherState.timeRemaining <= 0) {
      this.setRandomWeather();
    }
    
    // 如果天气会对木筏造成伤害，处理伤害效果
    if (this.currentWeatherState.effects && this.currentWeatherState.effects.raftDamage) {
      this.applyWeatherDamage(gameMinutesPassed);
    }
  }
  
  // 更新当前时间阶段
  updateTimePhase() {
    for (const [phase, data] of Object.entries(this.timePhases)) {
      // 处理跨午夜情况
      if (data.start < data.end) {
        if (this.timeOfDay >= data.start && this.timeOfDay < data.end) {
          this.currentTime = phase;
          return;
        }
      } else {
        // 跨午夜的相位 (如夜晚)
        if (this.timeOfDay >= data.start || this.timeOfDay < data.end) {
          this.currentTime = phase;
          return;
        }
      }
    }
  }
  
  // 设置随机天气
  setRandomWeather() {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const [type, data] of Object.entries(this.weatherTypes)) {
      cumulativeProbability += data.probability;
      
      if (random <= cumulativeProbability) {
        const duration = Math.floor(
          Math.random() * (data.duration.max - data.duration.min) + data.duration.min
        );
        
        this.currentWeatherState = {
          type: type,
          timeRemaining: duration,
          effects: data.effects || {}
        };
        
        this.currentWeather = type;
        this.broadcastWeatherChange();
        break;
      }
    }
  }
  
  // 强制设置特定天气 (用于事件或任务)
  setWeather(weatherType, duration) {
    if (!this.weatherTypes[weatherType]) return false;
    
    const weatherData = this.weatherTypes[weatherType];
    const actualDuration = duration || 
      Math.floor(Math.random() * (weatherData.duration.max - weatherData.duration.min) + weatherData.duration.min);
    
    this.currentWeatherState = {
      type: weatherType,
      timeRemaining: actualDuration,
      effects: weatherData.effects || {}
    };
    
    this.currentWeather = weatherType;
    this.broadcastWeatherChange();
    return true;
  }
  
  // 应用天气对木筏的伤害
  applyWeatherDamage(gameMinutesPassed) {
    // 每分钟造成一次伤害
    const damageInterval = 1; // 游戏内分钟
    const damageCounter = this.damageCounter || 0;
    
    this.damageCounter = damageCounter + gameMinutesPassed;
    
    if (this.damageCounter >= damageInterval) {
      this.damageCounter -= damageInterval;
      
      // 对所有玩家的木筏造成伤害
      for (const player of this.gameRoom.getActivePlayers()) {
        // 根据玩家的装备或设施可能减轻伤害
        const baseDamage = this.currentWeatherState.effects.raftDamage;
        const actualDamage = this.calculateActualDamage(player, baseDamage);
        
        if (actualDamage > 0) {
          this.gameRoom.damagePlayerRaft(player.socketId, actualDamage, 'weather');
        }
      }
    }
  }
  
  // 计算实际天气伤害 (考虑玩家防护设施)
  calculateActualDamage(player, baseDamage) {
    // 检查玩家是否有防风暴设施
    let damageReduction = 0;
    
    // TODO: 根据玩家的木筏结构和装备减少伤害
    // 这里将来可以读取玩家的装备和建筑来计算具体减伤
    
    return Math.max(0, baseDamage - damageReduction);
  }
  
  // 广播天气变化
  broadcastWeatherChange() {
    this.gameRoom.io.to(this.gameRoom.id).emit('weather:change', {
      type: this.currentWeather,
      effects: this.currentWeatherState.effects,
      duration: this.currentWeatherState.timeRemaining
    });
  }
  
  // 广播时间变化
  broadcastTimeChange() {
    this.gameRoom.io.to(this.gameRoom.id).emit('time:change', {
      phase: this.currentTime,
      timeOfDay: this.timeOfDay,
      visibility: this.timePhases[this.currentTime].visibility
    });
  }
  
  // 获取当前天气状态
  getWeatherState() {
    return {
      weather: this.currentWeather,
      time: this.currentTime,
      timeOfDay: Math.floor(this.timeOfDay),
      effects: this.currentWeatherState.effects
    };
  }
  
  // 生成天气相关特殊资源
  generateWeatherSpecificResources() {
    // 根据当前天气可能生成特殊资源
    if (this.currentWeather === 'storm' || this.currentWeather === 'heavyStorm') {
      const chanceForRareItem = this.currentWeatherState.effects.rareItemChance || 0;
      
      if (Math.random() <= chanceForRareItem) {
        // 生成风暴特有的稀有资源
        const rareItems = ['rare_wood', 'metal_parts', 'tech_components', 'treasure_chest'];
        const selectedItem = rareItems[Math.floor(Math.random() * rareItems.length)];
        
        // 随机位置生成
        const position = this.gameRoom.getRandomPosition(300);
        
        // 创建资源对象
        const resource = {
          id: `storm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: selectedItem,
          position,
          isRare: true,
          createdAt: Date.now()
        };
        
        this.gameRoom.addResource(resource);
        return resource;
      }
    }
    
    // 夜晚特殊资源 (如发光生物)
    if (this.currentTime === 'night' && Math.random() <= 0.15) {
      const nightItems = ['glowing_algae', 'bioluminescent_fish', 'moon_jellyfish'];
      const selectedItem = nightItems[Math.floor(Math.random() * nightItems.length)];
      
      const position = this.gameRoom.getRandomPosition(200);
      
      const resource = {
        id: `night_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: selectedItem,
        position,
        isRare: true,
        glowing: true,
        createdAt: Date.now()
      };
      
      this.gameRoom.addResource(resource);
      return resource;
    }
    
    return null;
  }
}

module.exports = Weather; 