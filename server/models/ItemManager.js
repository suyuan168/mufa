/**
 * 物品管理器类
 * 定义所有可制作物品及其效果
 */
class ItemManager {
  constructor() {
    // 所有物品定义
    this.items = {
      // 木筏升级
      raft_upgrade: {
        name: "木筏扩展",
        description: "增加木筏的大小，使其更加稳定",
        type: "structure",
        cost: {
          wood: 10,
          plastic: 5
        },
        effects: {
          raftSize: 1 // 增加木筏大小
        }
      },
      
      // 钓鱼竿
      fishing_rod: {
        name: "钓鱼竿",
        description: "用于捕捉鱼类，提供食物来源",
        type: "tool",
        cost: {
          wood: 4,
          plastic: 2
        },
        stats: {
          durability: 20,
          foodGainPerUse: 2
        }
      },
      
      // 净水器
      water_purifier: {
        name: "净水器",
        description: "将海水转化为饮用水",
        type: "station",
        cost: {
          plastic: 6,
          metal: 4
        },
        stats: {
          waterProduction: 1, // 每分钟产水量
          durability: 50
        }
      },
      
      // 鱼叉
      spear: {
        name: "鱼叉",
        description: "用于捕鱼和防御鲨鱼",
        type: "weapon",
        cost: {
          wood: 3,
          metal: 2
        },
        stats: {
          damage: 15,
          durability: 15,
          range: 3
        }
      },
      
      // 木盾
      wooden_shield: {
        name: "木盾",
        description: "提供防御能力，降低鲨鱼攻击造成的伤害",
        type: "armor",
        cost: {
          wood: 8
        },
        stats: {
          defense: 3,
          durability: 10
        }
      },
      
      // 金属鱼叉
      metal_spear: {
        name: "金属鱼叉",
        description: "更强的鱼叉，能造成更高伤害",
        type: "weapon",
        cost: {
          metal: 8
        },
        stats: {
          damage: 25,
          durability: 25,
          range: 4
        },
        requires: {
          item: "spear",
          count: 1
        }
      },
      
      // 烤炉
      grill: {
        name: "烤炉",
        description: "用于烹饪食物，提高食物效果",
        type: "station",
        cost: {
          metal: 5,
          wood: 3
        },
        stats: {
          cookingSpeed: 2, // 烹饪速度
          foodBoost: 1.5 // 食物营养提升倍数
        }
      }
    };
    
    // 按类型分组的物品
    this.itemsByType = {
      structure: [],
      tool: [],
      weapon: [],
      armor: [],
      station: []
    };
    
    // 初始化物品类型分组
    this.initItemTypes();
  }
  
  // 初始化物品类型分组
  initItemTypes() {
    for (const [id, item] of Object.entries(this.items)) {
      if (this.itemsByType[item.type]) {
        this.itemsByType[item.type].push({
          id,
          ...item
        });
      }
    }
  }
  
  // 获取物品信息
  getItem(itemId) {
    return this.items[itemId] || null;
  }
  
  // 获取物品制作成本
  getItemCost(itemId) {
    const item = this.getItem(itemId);
    return item ? item.cost : null;
  }
  
  // 获取某个类型的所有物品
  getItemsByType(type) {
    return this.itemsByType[type] || [];
  }
  
  // 获取所有物品ID列表
  getAllItemIds() {
    return Object.keys(this.items);
  }
  
  // 获取所有物品
  getAllItems() {
    return Object.entries(this.items).map(([id, item]) => ({
      id,
      ...item
    }));
  }
  
  // 使用工具/武器
  useItem(itemId, durabilityLoss = 1) {
    const item = this.getItem(itemId);
    if (!item) return { success: false, message: "物品不存在" };
    
    // 检查是否有耐久度
    if (!item.stats || typeof item.stats.durability !== 'number') {
      return { success: false, message: "此物品不可使用" };
    }
    
    // 减少耐久度
    item.stats.durability -= durabilityLoss;
    
    // 检查耐久度是否耗尽
    if (item.stats.durability <= 0) {
      return { 
        success: true, 
        broken: true, 
        message: `${item.name}已损坏`
      };
    }
    
    return {
      success: true,
      durability: item.stats.durability,
      message: `使用了${item.name}，剩余耐久度: ${item.stats.durability}`
    };
  }
  
  // 计算武器对鲨鱼的伤害
  calculateWeaponDamage(itemId) {
    const item = this.getItem(itemId);
    if (!item || item.type !== 'weapon') {
      return 5; // 默认伤害(徒手)
    }
    
    return item.stats.damage || 10;
  }
  
  // 计算防具减伤
  calculateArmorDefense(itemId) {
    const item = this.getItem(itemId);
    if (!item || item.type !== 'armor') {
      return 0; // 无防具
    }
    
    return item.stats.defense || 0;
  }
}

// 导出单例实例
module.exports = new ItemManager(); 