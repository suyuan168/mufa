/**
 * 木筏建造系统
 * 管理木筏的建造、升级和维护功能
 */
class RaftBuilder {
  constructor() {
    // 木筏组件类型
    this.componentTypes = {
      // 基础组件
      'foundation': {
        name: '基础平台',
        description: '木筏的基础平台，提供站立和建造空间',
        cost: { wood: 4, plastic: 2 },
        durability: 100,
        size: 1,
        required: true
      },
      'wall': {
        name: '围墙',
        description: '保护木筏免受海浪和敌人侵袭',
        cost: { wood: 3, plastic: 1 },
        durability: 80,
        defense: 2
      },
      'sail': {
        name: '帆',
        description: '利用风力推动木筏移动',
        cost: { wood: 2, fabric: 4 },
        durability: 60,
        speedBoost: 1.5
      },
      'storage': {
        name: '储物箱',
        description: '增加资源存储空间',
        cost: { wood: 5, rope: 2 },
        durability: 70,
        storageBoost: 10
      },
      'purifier': {
        name: '净水器',
        description: '将海水转化为饮用水',
        cost: { plastic: 6, metal: 3 },
        durability: 50,
        waterProduction: 1 // 每分钟产水量
      },
      'grill': {
        name: '烤炉',
        description: '用于烹饪食物',
        cost: { metal: 4, wood: 2 },
        durability: 60,
        foodBoost: 1.5
      },
      'anchor': {
        name: '锚',
        description: '固定木筏位置',
        cost: { metal: 5, rope: 3 },
        durability: 90
      },
      'radar': {
        name: '雷达',
        description: '探测远处的岛屿和资源',
        cost: { metal: 6, battery: 2, tech_parts: 1 },
        durability: 40,
        detectionRange: 1.5 // 探测范围倍数
      },
      'defense_net': {
        name: '防御网',
        description: '减少鲨鱼攻击的伤害',
        cost: { rope: 6, plastic: 3 },
        durability: 50,
        sharkDefense: 3
      },
      'engine': {
        name: '引擎',
        description: '提供稳定的动力来源',
        cost: { metal: 8, battery: 1, tech_parts: 2 },
        durability: 70,
        speedBoost: 2,
        requiresFuel: true
      }
    };
    
    // 木筏布局模板
    this.layoutTemplates = {
      'small': {
        size: 2,
        maxComponents: 4,
        baseHealth: 100
      },
      'medium': {
        size: 3,
        maxComponents: 8,
        baseHealth: 150
      },
      'large': {
        size: 4,
        maxComponents: 12,
        baseHealth: 200
      },
      'huge': {
        size: 5,
        maxComponents: 16,
        baseHealth: 250
      }
    };
  }
  
  /**
   * 计算建造组件所需的资源
   * @param {string} componentType - 组件类型
   * @param {number} quantity - 数量
   * @returns {Object|null} 所需资源列表或null
   */
  getComponentCost(componentType, quantity = 1) {
    const component = this.componentTypes[componentType];
    if (!component) return null;
    
    const cost = {};
    for (const [resource, amount] of Object.entries(component.cost)) {
      cost[resource] = amount * quantity;
    }
    
    return cost;
  }
  
  /**
   * 检查玩家是否有足够的资源建造组件
   * @param {Object} inventory - 玩家库存
   * @param {string} componentType - 组件类型
   * @param {number} quantity - 数量
   * @returns {boolean} 是否有足够资源
   */
  canBuildComponent(inventory, componentType, quantity = 1) {
    const cost = this.getComponentCost(componentType, quantity);
    if (!cost) return false;
    
    for (const [resource, amount] of Object.entries(cost)) {
      if (!inventory[resource] || inventory[resource] < amount) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 从玩家库存中扣除建造所需资源
   * @param {Object} inventory - 玩家库存
   * @param {string} componentType - 组件类型
   * @param {number} quantity - 数量
   * @returns {boolean} 是否成功扣除
   */
  consumeResources(inventory, componentType, quantity = 1) {
    if (!this.canBuildComponent(inventory, componentType, quantity)) {
      return false;
    }
    
    const cost = this.getComponentCost(componentType, quantity);
    
    for (const [resource, amount] of Object.entries(cost)) {
      inventory[resource] -= amount;
    }
    
    return true;
  }
  
  /**
   * 创建新的木筏组件
   * @param {string} componentType - 组件类型
   * @returns {Object|null} 创建的组件或null
   */
  createComponent(componentType) {
    const template = this.componentTypes[componentType];
    if (!template) return null;
    
    return {
      type: componentType,
      name: template.name,
      durability: template.durability,
      health: template.durability, // 当前耐久度
      ...template
    };
  }
  
  /**
   * 计算木筏的总体属性
   * @param {Array} components - 木筏组件列表
   * @param {string} layoutType - 布局类型
   * @returns {Object} 木筏属性
   */
  calculateRaftProperties(components, layoutType = 'small') {
    const layout = this.layoutTemplates[layoutType] || this.layoutTemplates.small;
    
    // 基础属性
    const properties = {
      size: layout.size,
      maxHealth: layout.baseHealth,
      currentHealth: layout.baseHealth,
      defense: 0,
      speed: 1,
      storage: 20, // 基础存储容量
      waterProduction: 0,
      foodBoost: 1,
      detectionRange: 1,
      sharkDefense: 0
    };
    
    // 累加组件属性
    for (const component of components) {
      if (component.defense) properties.defense += component.defense;
      if (component.speedBoost) properties.speed *= component.speedBoost;
      if (component.storageBoost) properties.storage += component.storageBoost;
      if (component.waterProduction) properties.waterProduction += component.waterProduction;
      if (component.foodBoost) properties.foodBoost *= component.foodBoost;
      if (component.detectionRange) properties.detectionRange *= component.detectionRange;
      if (component.sharkDefense) properties.sharkDefense += component.sharkDefense;
    }
    
    return properties;
  }
  
  /**
   * 修复木筏组件
   * @param {Object} component - 组件对象
   * @param {Object} inventory - 玩家库存
   * @param {number} amount - 修复量
   * @returns {Object} 修复结果
   */
  repairComponent(component, inventory, amount = 50) {
    // 计算修复所需资源 (通常是建造成本的一半)
    const template = this.componentTypes[component.type];
    if (!template) return { success: false, message: '未知组件类型' };
    
    const repairCost = {};
    for (const [resource, cost] of Object.entries(template.cost)) {
      repairCost[resource] = Math.ceil(cost * 0.5 * (amount / 100));
    }
    
    // 检查资源是否足够
    for (const [resource, cost] of Object.entries(repairCost)) {
      if (!inventory[resource] || inventory[resource] < cost) {
        return { 
          success: false, 
          message: `修复需要 ${cost} 个 ${resource}，资源不足` 
        };
      }
    }
    
    // 扣除资源
    for (const [resource, cost] of Object.entries(repairCost)) {
      inventory[resource] -= cost;
    }
    
    // 修复组件
    const oldHealth = component.health;
    component.health = Math.min(component.durability, component.health + amount);
    const actualRepair = component.health - oldHealth;
    
    return {
      success: true,
      message: `修复了 ${component.name}，恢复了 ${actualRepair} 点耐久度`,
      component
    };
  }
  
  /**
   * 升级木筏布局
   * @param {string} currentLayout - 当前布局
   * @param {Object} inventory - 玩家库存
   * @returns {Object} 升级结果
   */
  upgradeRaftLayout(currentLayout, inventory) {
    const layouts = Object.keys(this.layoutTemplates);
    const currentIndex = layouts.indexOf(currentLayout);
    
    if (currentIndex === -1 || currentIndex === layouts.length - 1) {
      return { success: false, message: '无法升级木筏布局' };
    }
    
    const nextLayout = layouts[currentIndex + 1];
    const upgradeCost = {
      wood: 20 * (currentIndex + 2),
      plastic: 10 * (currentIndex + 2),
      metal: 5 * (currentIndex + 2),
      rope: 8 * (currentIndex + 2)
    };
    
    // 检查资源是否足够
    for (const [resource, cost] of Object.entries(upgradeCost)) {
      if (!inventory[resource] || inventory[resource] < cost) {
        return { 
          success: false, 
          message: `升级需要 ${cost} 个 ${resource}，资源不足` 
        };
      }
    }
    
    // 扣除资源
    for (const [resource, cost] of Object.entries(upgradeCost)) {
      inventory[resource] -= cost;
    }
    
    return {
      success: true,
      message: `木筏布局升级到 ${nextLayout}`,
      newLayout: nextLayout,
      layoutProperties: this.layoutTemplates[nextLayout]
    };
  }
  
  /**
   * 获取组件信息
   * @param {string} componentType - 组件类型
   * @returns {Object|null} 组件信息或null
   */
  getComponentInfo(componentType) {
    return this.componentTypes[componentType] || null;
  }
  
  /**
   * 获取所有可用组件类型
   * @returns {Array} 组件类型列表
   */
  getAllComponentTypes() {
    return Object.keys(this.componentTypes).map(type => ({
      type,
      ...this.componentTypes[type]
    }));
  }
  
  /**
   * 获取布局信息
   * @param {string} layoutType - 布局类型
   * @returns {Object|null} 布局信息或null
   */
  getLayoutInfo(layoutType) {
    return this.layoutTemplates[layoutType] || null;
  }
  
  /**
   * 获取所有可用布局
   * @returns {Array} 布局列表
   */
  getAllLayouts() {
    return Object.keys(this.layoutTemplates).map(type => ({
      type,
      ...this.layoutTemplates[type]
    }));
  }
}

module.exports = RaftBuilder;