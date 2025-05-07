/**
 * 资源管理系统
 * 管理游戏中的资源生成、收集和使用
 */
class ResourceManager {
  constructor() {
    // 基础资源类型及其属性
    this.resourceTypes = {
      'wood': {
        name: '木材',
        description: '基础建筑材料，用于制作木筏和工具',
        baseValue: 1,
        weight: 1,
        stackSize: 20,
        floatTime: 300000, // 漂浮时间(毫秒)
        spawnWeight: 30 // 生成权重
      },
      'plastic': {
        name: '塑料',
        description: '轻质材料，用于制作容器和防水物品',
        baseValue: 1,
        weight: 0.5,
        stackSize: 20,
        floatTime: 240000,
        spawnWeight: 25
      },
      'metal': {
        name: '金属',
        description: '坚固的材料，用于制作高级工具和结构',
        baseValue: 2,
        weight: 2,
        stackSize: 15,
        floatTime: 180000,
        spawnWeight: 15
      },
      'rope': {
        name: '绳索',
        description: '用于绑定和制作网、帆等',
        baseValue: 2,
        weight: 0.8,
        stackSize: 10,
        floatTime: 210000,
        spawnWeight: 15
      },
      'fabric': {
        name: '布料',
        description: '用于制作帆、衣物和过滤器',
        baseValue: 2,
        weight: 0.5,
        stackSize: 10,
        floatTime: 150000,
        spawnWeight: 10
      },
      'food': {
        name: '食物',
        description: '维持生命所需的营养',
        baseValue: 3,
        weight: 1,
        stackSize: 10,
        floatTime: 120000,
        spawnWeight: 10,
        consumable: true,
        hungerRestore: 20
      },
      'water': {
        name: '淡水',
        description: '维持生命所需的水分',
        baseValue: 3,
        weight: 1,
        stackSize: 10,
        floatTime: 90000,
        spawnWeight: 10,
        consumable: true,
        thirstRestore: 20
      },
      'battery': {
        name: '电池',
        description: '为电子设备提供能源',
        baseValue: 4,
        weight: 0.5,
        stackSize: 5,
        floatTime: 120000,
        spawnWeight: 5
      },
      'tool_parts': {
        name: '工具零件',
        description: '用于制作和修理高级工具',
        baseValue: 3,
        weight: 0.8,
        stackSize: 8,
        floatTime: 150000,
        spawnWeight: 8
      },
      'medical_kit': {
        name: '医疗包',
        description: '用于治疗伤口和疾病',
        baseValue: 5,
        weight: 1,
        stackSize: 3,
        floatTime: 180000,
        spawnWeight: 3,
        consumable: true,
        healthRestore: 50
      },
      'valuable_item': {
        name: '贵重物品',
        description: '可用于与商人交易的珍贵物品',
        baseValue: 10,
        weight: 0.5,
        stackSize: 5,
        floatTime: 300000,
        spawnWeight: 2,
        isValuable: true
      }
    };
    
    // 稀有资源类型
    this.rareResourceTypes = {
      'rare_seed': {
        name: '稀有种子',
        description: '可以种植特殊植物的种子',
        baseValue: 8,
        weight: 0.2,
        stackSize: 3,
        floatTime: 120000,
        spawnWeight: 1
      },
      'blueprint': {
        name: '蓝图',
        description: '解锁特殊建筑或工具的图纸',
        baseValue: 15,
        weight: 0.3,
        stackSize: 1,
        floatTime: 180000,
        spawnWeight: 1,
        isBlueprint: true
      },
      'tech_components': {
        name: '科技组件',
        description: '用于制作高级电子设备',
        baseValue: 12,
        weight: 0.5,
        stackSize: 3,
        floatTime: 150000,
        spawnWeight: 1
      },
      'pirate_treasure': {
        name: '海盗宝藏',
        description: '海盗收集的贵重物品',
        baseValue: 20,
        weight: 2,
        stackSize: 1,
        floatTime: 300000,
        spawnWeight: 0.5,
        isValuable: true
      }
    };
    
    // 天气特定资源
    this.weatherSpecificResources = {
      'storm': [
        'metal',
        'rope',
        'tech_components'
      ],
      'heavyStorm': [
        'metal',
        'tech_components',
        'valuable_item',
        'blueprint'
      ],
      'foggy': [
        'wood',
        'plastic'
      ]
    };
  }
  
  /**
   * 获取资源信息
   * @param {string} resourceType - 资源类型
   * @returns {Object|null} 资源信息或null
   */
  getResourceInfo(resourceType) {
    return this.resourceTypes[resourceType] || 
           this.rareResourceTypes[resourceType] || 
           null;
  }
  
  /**
   * 生成随机资源
   * @param {string} weatherType - 当前天气类型
   * @param {boolean} isRare - 是否生成稀有资源
   * @returns {Object} 生成的资源对象
   */
  generateRandomResource(weatherType = 'clear', isRare = false) {
    let resourcePool = [];
    let totalWeight = 0;
    
    // 根据天气调整资源池
    if (isRare) {
      // 稀有资源池
      for (const [type, info] of Object.entries(this.rareResourceTypes)) {
        resourcePool.push({
          type,
          weight: info.spawnWeight
        });
        totalWeight += info.spawnWeight;
      }
    } else {
      // 普通资源池
      for (const [type, info] of Object.entries(this.resourceTypes)) {
        // 天气特定资源有更高的生成概率
        let adjustedWeight = info.spawnWeight;
        
        if (this.weatherSpecificResources[weatherType] && 
            this.weatherSpecificResources[weatherType].includes(type)) {
          adjustedWeight *= 2; // 天气特定资源权重加倍
        }
        
        resourcePool.push({
          type,
          weight: adjustedWeight
        });
        totalWeight += adjustedWeight;
      }
    }
    
    // 按权重随机选择资源
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let selectedType = resourcePool[0].type; // 默认选第一个
    
    for (const resource of resourcePool) {
      cumulativeWeight += resource.weight;
      if (random <= cumulativeWeight) {
        selectedType = resource.type;
        break;
      }
    }
    
    // 获取资源信息
    const resourceInfo = this.getResourceInfo(selectedType);
    
    // 生成资源数量 (大多数情况为1，但基础资源可能更多)
    let amount = 1;
    if (!isRare && ['wood', 'plastic', 'food', 'water'].includes(selectedType)) {
      amount = Math.floor(Math.random() * 3) + 1;
    }
    
    // 创建资源对象
    const now = Date.now();
    return {
      id: `res_${selectedType}_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type: selectedType,
      name: resourceInfo.name,
      amount: amount,
      position: { x: 0, y: 0 }, // 位置需要在游戏房间中设置
      createdAt: now,
      expiresAt: now + resourceInfo.floatTime,
      isRare: isRare
    };
  }
  
  /**
   * 生成天气特定资源
   * @param {string} weatherType - 天气类型
   * @returns {Object|null} 资源对象或null
   */
  generateWeatherSpecificResource(weatherType) {
    if (!this.weatherSpecificResources[weatherType]) {
      return null;
    }
    
    // 只有一定概率生成特定资源
    const chanceToGenerate = weatherType === 'heavyStorm' ? 0.4 : 0.2;
    if (Math.random() > chanceToGenerate) {
      return null;
    }
    
    // 从天气特定资源中随机选择
    const possibleTypes = this.weatherSpecificResources[weatherType];
    const selectedType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    
    // 检查是否是稀有资源
    const isRare = this.rareResourceTypes[selectedType] !== undefined;
    const resourceInfo = this.getResourceInfo(selectedType);
    
    // 创建资源对象
    const now = Date.now();
    return {
      id: `res_weather_${selectedType}_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type: selectedType,
      name: resourceInfo.name,
      amount: 1,
      position: { x: 0, y: 0 }, // 位置需要在游戏房间中设置
      createdAt: now,
      expiresAt: now + resourceInfo.floatTime,
      isRare: isRare,
      fromWeather: weatherType
    };
  }
  
  /**
   * 获取所有基础资源类型
   * @returns {Array} 资源类型列表
   */
  getAllBasicResourceTypes() {
    return Object.keys(this.resourceTypes).map(type => ({
      type,
      ...this.resourceTypes[type]
    }));
  }
  
  /**
   * 获取所有稀有资源类型
   * @returns {Array} 资源类型列表
   */
  getAllRareResourceTypes() {
    return Object.keys(this.rareResourceTypes).map(type => ({
      type,
      ...this.rareResourceTypes[type]
    }));
  }
  
  /**
   * 检查资源是否过期
   * @param {Object} resource - 资源对象
   * @param {number} currentTime - 当前时间戳
   * @returns {boolean} 是否过期
   */
  isResourceExpired(resource, currentTime) {
    return resource.expiresAt && currentTime > resource.expiresAt;
  }
  
  /**
   * 计算资源的交易价值
   * @param {string} resourceType - 资源类型
   * @param {number} amount - 数量
   * @returns {number} 交易价值
   */
  calculateTradeValue(resourceType, amount = 1) {
    const resourceInfo = this.getResourceInfo(resourceType);
    if (!resourceInfo) return 0;
    
    let value = resourceInfo.baseValue * amount;
    
    // 稀有或贵重物品价值更高
    if (resourceInfo.isRare || resourceInfo.isValuable) {
      value *= 1.5;
    }
    
    return Math.round(value);
  }
  
  /**
   * 消耗资源
   * @param {Object} inventory - 玩家库存
   * @param {Object} resources - 需要消耗的资源 {resourceType: amount}
   * @returns {boolean} 是否成功消耗
   */
  consumeResources(inventory, resources) {
    // 检查资源是否足够
    for (const [type, amount] of Object.entries(resources)) {
      if (!inventory[type] || inventory[type] < amount) {
        return false;
      }
    }
    
    // 扣除资源
    for (const [type, amount] of Object.entries(resources)) {
      inventory[type] -= amount;
    }
    
    return true;
  }
}

module.exports = ResourceManager;