/**
 * 木筏建造系统单元测试
 */
const RaftBuilder = require('../server/models/RaftBuilder');

// 模拟玩家库存
const mockInventory = {
  wood: 50,
  plastic: 30,
  metal: 20,
  rope: 15,
  fabric: 10
};

describe('RaftBuilder', () => {
  let raftBuilder;

  beforeEach(() => {
    raftBuilder = new RaftBuilder();
  });

  describe('getComponentCost', () => {
    test('应该返回组件的正确成本', () => {
      const cost = raftBuilder.getComponentCost('foundation');
      expect(cost).toEqual({ wood: 4, plastic: 2 });
    });

    test('对于不存在的组件类型应返回null', () => {
      const cost = raftBuilder.getComponentCost('nonexistent_component');
      expect(cost).toBeNull();
    });

    test('应该根据数量计算成本', () => {
      const cost = raftBuilder.getComponentCost('foundation', 3);
      expect(cost).toEqual({ wood: 12, plastic: 6 });
    });
  });

  describe('canBuildComponent', () => {
    test('当库存足够时应返回true', () => {
      const canBuild = raftBuilder.canBuildComponent(mockInventory, 'foundation');
      expect(canBuild).toBe(true);
    });

    test('当库存不足时应返回false', () => {
      const poorInventory = { wood: 1, plastic: 1 };
      const canBuild = raftBuilder.canBuildComponent(poorInventory, 'foundation');
      expect(canBuild).toBe(false);
    });

    test('当组件不存在时应返回false', () => {
      const canBuild = raftBuilder.canBuildComponent(mockInventory, 'nonexistent_component');
      expect(canBuild).toBe(false);
    });
  });

  describe('consumeResources', () => {
    test('应该正确扣除资源', () => {
      const inventory = { ...mockInventory };
      const result = raftBuilder.consumeResources(inventory, 'foundation');
      
      expect(result).toBe(true);
      expect(inventory.wood).toBe(mockInventory.wood - 4);
      expect(inventory.plastic).toBe(mockInventory.plastic - 2);
    });

    test('当资源不足时不应扣除资源', () => {
      const inventory = { wood: 3, plastic: 2 };
      const result = raftBuilder.consumeResources(inventory, 'foundation');
      
      expect(result).toBe(false);
      expect(inventory.wood).toBe(3); // 不应改变
      expect(inventory.plastic).toBe(2); // 不应改变
    });
  });

  describe('createComponent', () => {
    test('应该创建有效的组件对象', () => {
      const component = raftBuilder.createComponent('foundation');
      
      expect(component).not.toBeNull();
      expect(component.type).toBe('foundation');
      expect(component.name).toBe('基础平台');
      expect(component.durability).toBe(100);
      expect(component.health).toBe(100);
    });

    test('对于不存在的组件类型应返回null', () => {
      const component = raftBuilder.createComponent('nonexistent_component');
      expect(component).toBeNull();
    });
  });

  describe('calculateRaftProperties', () => {
    test('应该计算空木筏的基础属性', () => {
      const properties = raftBuilder.calculateRaftProperties([], 'small');
      
      expect(properties.size).toBe(2);
      expect(properties.maxHealth).toBe(100);
      expect(properties.speed).toBe(1);
      expect(properties.storage).toBe(20);
    });

    test('应该累加组件属性', () => {
      const components = [
        raftBuilder.createComponent('sail'),
        raftBuilder.createComponent('storage')
      ];
      
      const properties = raftBuilder.calculateRaftProperties(components, 'small');
      
      expect(properties.speed).toBeGreaterThan(1); // 帆提高速度
      expect(properties.storage).toBeGreaterThan(20); // 储物箱增加存储
    });

    test('应该使用默认布局当指定的布局不存在', () => {
      const properties = raftBuilder.calculateRaftProperties([], 'nonexistent_layout');
      
      expect(properties.size).toBe(2); // 小型布局的默认值
      expect(properties.maxHealth).toBe(100); // 小型布局的默认值
    });
  });

  describe('repairComponent', () => {
    test('应该修复受损的组件', () => {
      const component = raftBuilder.createComponent('foundation');
      component.health = 50; // 设置为受损状态
      
      const result = raftBuilder.repairComponent(component, mockInventory);
      
      expect(result.success).toBe(true);
      expect(result.component.health).toBeGreaterThan(50);
    });

    test('当资源不足时不应修复组件', () => {
      const component = raftBuilder.createComponent('foundation');
      component.health = 50;
      
      const poorInventory = { wood: 1 }; // 不足以修理
      const result = raftBuilder.repairComponent(component, poorInventory);
      
      expect(result.success).toBe(false);
    });

    test('当组件不需要修理时应返回失败', () => {
      const component = raftBuilder.createComponent('foundation');
      // 健康度等于耐久度，不需要修理
      component.health = component.durability;
      
      const result = raftBuilder.repairComponent(component, mockInventory);
      
      expect(result.success).toBe(false);
    });
  });

  describe('upgradeRaftLayout', () => {
    test('应该升级木筏布局', () => {
      const result = raftBuilder.upgradeRaftLayout('small', mockInventory);
      
      expect(result.success).toBe(true);
      expect(result.newLayout).toBe('medium');
    });

    test('当资源不足时不应升级布局', () => {
      const poorInventory = { wood: 10, plastic: 5 }; // 不足以升级
      const result = raftBuilder.upgradeRaftLayout('small', poorInventory);
      
      expect(result.success).toBe(false);
    });

    test('当已是最大布局时不应升级', () => {
      const result = raftBuilder.upgradeRaftLayout('huge', mockInventory);
      
      expect(result.success).toBe(false);
    });
  });
});