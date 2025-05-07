/**
 * 生存需求系统
 * 管理玩家的饥饿、口渴和健康状态
 */
class SurvivalSystem {
  constructor() {
    // 生存需求默认值
    this.defaultValues = {
      hunger: 100,      // 饥饿值 (0-100)
      thirst: 100,     // 口渴值 (0-100)
      health: 100,     // 健康值 (0-100)
      temperature: 37, // 体温 (℃)
      energy: 100      // 能量值 (0-100)
    };
    
    // 生存需求消耗速率 (每分钟)
    this.consumptionRates = {
      hunger: 1.5,     // 饥饿值每分钟降低1.5点
      thirst: 2,       // 口渴值每分钟降低2点
      energy: 1        // 能量值每分钟降低1点
    };
    
    // 临界值及其效果
    this.thresholds = {
      hunger: {
        warning: 30,   // 警告阈值
        critical: 10,  // 危险阈值
        lethal: 0      // 致命阈值
      },
      thirst: {
        warning: 30,
        critical: 10,
        lethal: 0
      },
      health: {
        warning: 30,
        critical: 10,
        lethal: 0
      },
      temperature: {
        cold: 35,      // 过冷阈值
        hot: 39        // 过热阈值
      }
    };
    
    // 天气对生存需求的影响
    this.weatherEffects = {
      'clear': {
        temperatureModifier: 0,
        energyConsumption: 1
      },
      'cloudy': {
        temperatureModifier: -0.5,
        energyConsumption: 1
      },
      'foggy': {
        temperatureModifier: -1,
        energyConsumption: 1.2
      },
      'storm': {
        temperatureModifier: -2,
        energyConsumption: 1.5
      },
      'heavyStorm': {
        temperatureModifier: -3,
        energyConsumption: 2
      }
    };
    
    // 时间对生存需求的影响
    this.timeEffects = {
      'dawn': {
        temperatureModifier: -1
      },
      'day': {
        temperatureModifier: 0
      },
      'dusk': {
        temperatureModifier: -1
      },
      'night': {
        temperatureModifier: -2
      }
    };
  }
  
  /**
   * 初始化玩家生存状态
   * @returns {Object} 初始生存状态
   */
  initializePlayerSurvivalState() {
    return {
      ...this.defaultValues,
      lastUpdate: Date.now(),
      effects: [],
      // 状态标志
      isHungry: false,
      isThirsty: false,
      isInjured: false,
      isCold: false,
      isHot: false,
      isTired: false
    };
  }
  
  /**
   * 更新玩家生存状态
   * @param {Object} survivalState - 玩家当前生存状态
   * @param {number} deltaTime - 时间增量(毫秒)
   * @param {string} weatherType - 当前天气
   * @param {string} timeOfDay - 当前时间段
   * @returns {Object} 更新后的生存状态
   */
  updateSurvivalState(survivalState, deltaTime, weatherType = 'clear', timeOfDay = 'day') {
    const minutesPassed = deltaTime / (1000 * 60); // 转换为分钟
    const now = Date.now();
    
    // 复制状态以避免直接修改原对象
    const newState = { ...survivalState };
    
    // 更新时间戳
    newState.lastUpdate = now;
    
    // 计算天气和时间的综合影响
    const weatherEffect = this.weatherEffects[weatherType] || this.weatherEffects.clear;
    const timeEffect = this.timeEffects[timeOfDay] || this.timeEffects.day;
    
    // 更新饥饿值
    newState.hunger = Math.max(0, newState.hunger - (this.consumptionRates.hunger * minutesPassed));
    
    // 更新口渴值
    newState.thirst = Math.max(0, newState.thirst - (this.consumptionRates.thirst * minutesPassed));
    
    // 更新能量值
    const energyConsumption = this.consumptionRates.energy * weatherEffect.energyConsumption;
    newState.energy = Math.max(0, newState.energy - (energyConsumption * minutesPassed));
    
    // 更新体温
    const tempModifier = weatherEffect.temperatureModifier + timeEffect.temperatureModifier;
    newState.temperature = Math.max(30, Math.min(42, newState.temperature + (tempModifier * 0.1 * minutesPassed)));
    
    // 检查生存状态对健康的影响
    let healthChange = 0;
    
    // 饥饿对健康的影响
    if (newState.hunger <= this.thresholds.hunger.critical) {
      healthChange -= 0.5 * minutesPassed;
      newState.isHungry = true;
    } else {
      newState.isHungry = false;
    }
    
    // 口渴对健康的影响
    if (newState.thirst <= this.thresholds.thirst.critical) {
      healthChange -= 1 * minutesPassed; // 口渴对健康的影响更大
      newState.isThirsty = true;
    } else {
      newState.isThirsty = false;
    }
    
    // 体温对健康的影响
    if (newState.temperature <= this.thresholds.temperature.cold) {
      healthChange -= 0.8 * minutesPassed;
      newState.isCold = true;
      newState.isHot = false;
    } else if (newState.temperature >= this.thresholds.temperature.hot) {
      healthChange -= 0.8 * minutesPassed;
      newState.isHot = true;
      newState.isCold = false;
    } else {
      newState.isCold = false;
      newState.isHot = false;
    }
    
    // 能量不足对健康的影响
    if (newState.energy <= 20) {
      healthChange -= 0.3 * minutesPassed;
      newState.isTired = true;
    } else {
      newState.isTired = false;
    }
    
    // 应用健康变化
    newState.health = Math.max(0, Math.min(100, newState.health + healthChange));
    
    // 更新受伤状态
    newState.isInjured = newState.health < 70;
    
    // 检查是否有临时效果过期
    if (newState.effects && newState.effects.length > 0) {
      newState.effects = newState.effects.filter(effect => effect.expiresAt > now);
    }
    
    return newState;
  }
  
  /**
   * 消耗食物
   * @param {Object} survivalState - 玩家生存状态
   * @param {Object} foodItem - 食物物品
   * @returns {Object} 更新后的生存状态
   */
  consumeFood(survivalState, foodItem) {
    const newState = { ...survivalState };
    
    // 基础食物恢复值
    let hungerRestore = foodItem.hungerRestore || 20;
    
    // 应用烹饪加成 (如果有)
    if (foodItem.isCooked && foodItem.cookingBonus) {
      hungerRestore *= foodItem.cookingBonus;
    }
    
    // 恢复饥饿值
    newState.hunger = Math.min(100, newState.hunger + hungerRestore);
    
    // 某些食物可能也会恢复少量水分
    if (foodItem.thirstRestore) {
      newState.thirst = Math.min(100, newState.thirst + foodItem.thirstRestore);
    }
    
    // 某些食物可能有特殊效果
    if (foodItem.effects) {
      // 添加临时效果
      if (!newState.effects) {
        newState.effects = [];
      }
      
      const now = Date.now();
      for (const effect of foodItem.effects) {
        newState.effects.push({
          ...effect,
          startedAt: now,
          expiresAt: now + (effect.duration || 300000) // 默认5分钟
        });
      }
    }
    
    return newState;
  }
  
  /**
   * 饮用水
   * @param {Object} survivalState - 玩家生存状态
   * @param {Object} waterItem - 水物品
   * @returns {Object} 更新后的生存状态
   */
  consumeWater(survivalState, waterItem) {
    const newState = { ...survivalState };
    
    // 恢复口渴值
    const thirstRestore = waterItem.thirstRestore || 20;
    newState.thirst = Math.min(100, newState.thirst + thirstRestore);
    
    return newState;
  }
  
  /**
   * 使用医疗物品
   * @param {Object} survivalState - 玩家生存状态
   * @param {Object} medicalItem - 医疗物品
   * @returns {Object} 更新后的生存状态
   */
  useMedicalItem(survivalState, medicalItem) {
    const newState = { ...survivalState };
    
    // 恢复健康值
    const healthRestore = medicalItem.healthRestore || 20;
    newState.health = Math.min(100, newState.health + healthRestore);
    
    // 某些医疗物品可能有特殊效果
    if (medicalItem.effects) {
      // 添加临时效果
      if (!newState.effects) {
        newState.effects = [];
      }
      
      const now = Date.now();
      for (const effect of medicalItem.effects) {
        newState.effects.push({
          ...effect,
          startedAt: now,
          expiresAt: now + (effect.duration || 300000) // 默认5分钟
        });
      }
    }
    
    return newState;
  }
  
  /**
   * 休息恢复能量
   * @param {Object} survivalState - 玩家生存状态
   * @param {number} duration - 休息时长(毫秒)
   * @returns {Object} 更新后的生存状态
   */
  rest(survivalState, duration) {
    const newState = { ...survivalState };
    const minutesRested = duration / (1000 * 60);
    
    // 恢复能量
    const energyRestore = 5 * minutesRested; // 每分钟恢复5点能量
    newState.energy = Math.min(100, newState.energy + energyRestore);
    
    // 休息也会略微恢复健康
    if (newState.health < 100) {
      const healthRestore = 1 * minutesRested; // 每分钟恢复1点健康
      newState.health = Math.min(100, newState.health + healthRestore);
    }
    
    return newState;
  }
  
  /**
   * 受到伤害
   * @param {Object} survivalState - 玩家生存状态
   * @param {number} damage - 伤害值
   * @param {string} damageType - 伤害类型
   * @returns {Object} 更新后的生存状态
   */
  takeDamage(survivalState, damage, damageType = 'physical') {
    const newState = { ...survivalState };
    
    // 不同类型的伤害可能有不同的效果
    switch (damageType) {
      case 'physical':
        newState.health = Math.max(0, newState.health - damage);
        break;
      case 'cold':
        newState.temperature = Math.max(30, newState.temperature - damage);
        newState.health = Math.max(0, newState.health - (damage * 0.5));
        break;
      case 'heat':
        newState.temperature = Math.min(42, newState.temperature + damage);
        newState.health = Math.max(0, newState.health - (damage * 0.5));
        break;
      case 'hunger':
        newState.hunger = Math.max(0, newState.hunger - damage);
        break;
      case 'thirst':
        newState.thirst = Math.max(0, newState.thirst - damage);
        break;
      default:
        newState.health = Math.max(0, newState.health - damage);
    }
    
    // 更新受伤状态
    newState.isInjured = newState.health < 70;
    
    return newState;
  }
  
  /**
   * 获取生存状态描述
   * @param {Object} survivalState - 玩家生存状态
   * @returns {Object} 状态描述
   */
  getSurvivalStatusDescription(survivalState) {
    const status = {
      hunger: this.getStatusLevel(survivalState.hunger, this.thresholds.hunger),
      thirst: this.getStatusLevel(survivalState.thirst, this.thresholds.thirst),
      health: this.getStatusLevel(survivalState.health, this.thresholds.health),
      temperature: this.getTemperatureStatus(survivalState.temperature),
      energy: survivalState.energy <= 20 ? 'low' : (survivalState.energy <= 50 ? 'medium' : 'high'),
      effects: survivalState.effects || []
    };
    
    // 添加状态描述
    status.description = this.generateStatusDescription(survivalState, status);
    
    return status;
  }
  
  /**
   * 获取状态级别
   * @param {number} value - 当前值
   * @param {Object} thresholds - 阈值对象
   * @returns {string} 状态级别
   */
  getStatusLevel(value, thresholds) {
    if (value <= thresholds.lethal) return 'critical';
    if (value <= thresholds.critical) return 'danger';
    if (value <= thresholds.warning) return 'warning';
    return 'normal';
  }
  
  /**
   * 获取体温状态
   * @param {number} temperature - 体温值
   * @returns {string} 体温状态
   */
  getTemperatureStatus(temperature) {
    if (temperature <= this.thresholds.temperature.cold) return 'cold';
    if (temperature >= this.thresholds.temperature.hot) return 'hot';
    return 'normal';
  }
  
  /**
   * 生成状态描述
   * @param {Object} state - 生存状态
   * @param {Object} status - 状态级别
   * @returns {string} 状态描述
   */
  generateStatusDescription(state, status) {
    const descriptions = [];
    
    if (status.hunger === 'critical') {
      descriptions.push('极度饥饿，需要立即进食');
    } else if (status.hunger === 'danger') {
      descriptions.push('非常饥饿，需要尽快进食');
    } else if (status.hunger === 'warning') {
      descriptions.push('有些饿了，应该找些食物');
    }
    
    if (status.thirst === 'critical') {
      descriptions.push('极度口渴，需要立即饮水');
    } else if (status.thirst === 'danger') {
      descriptions.push('非常口渴，需要尽快饮水');
    } else if (status.thirst === 'warning') {
      descriptions.push('有些渴了，应该找些水');
    }
    
    if (status.health === 'critical') {
      descriptions.push('生命垂危，需要立即治疗');
    } else if (status.health === 'danger') {
      descriptions.push('严重受伤，需要尽快治疗');
    } else if (status.health === 'warning') {
      descriptions.push('受了轻伤，应该处理一下');
    }
    
    if (status.temperature === 'cold') {
      descriptions.push('体温过低，需要取暖');
    } else if (status.temperature === 'hot') {
      descriptions.push('体温过高，需要降温');
    }
    
    if (status.energy === 'low') {
      descriptions.push('精力耗尽，需要休息');
    } else if (status.energy === 'medium') {
      descriptions.push('有些疲惫，应该适当休息');
    }
    
    // 添加效果描述
    if (state.effects && state.effects.length > 0) {
      for (const effect of state.effects) {
        descriptions.push(`${effect.name}: ${effect.description}`);
      }
    }
    
    return descriptions.join('；');
  }
  
  /**
   * 检查玩家是否存活
   * @param {Object} survivalState - 玩家生存状态
   * @returns {boolean} 是否存活
   */
  isPlayerAlive(survivalState) {
    return survivalState.health > 0;
  }
}

module.exports = SurvivalSystem;