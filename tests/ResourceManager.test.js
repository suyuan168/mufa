/**
 * 资源管理系统单元测试
 */
const ResourceManager = require('../server/models/ResourceManager');

describe('ResourceManager', () => {
  let resourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('getResourceInfo', () => {
    test('应该返回基础资源的正确信息', () => {
      const info = resourceManager.getResourceInfo('wood');
      expect(info).not.toBeNull();
      expect(info.name).toBe('木材');
      expect(info.baseValue).toBe(1);
    });

    test('应该返回稀有资源的正确信息', () => {
      const info = resourceManager.getResourceInfo('blueprint');
      expect(info).not.toBeNull();
      expect(info.name).toBe('蓝图');
      expect(info.isBlueprint).toBe(true);
    });

    test('对于不存在的资源类型应返回null', () => {
      const info = resourceManager.getResourceInfo('nonexistent_resource');
      expect(info).toBeNull();
    });
  });

  describe('generateRandomResource', () => {
    test('应该生成有效的资源对象', () => {
      const resource = resourceManager.generateRandomResource('clear', false);
      
      expect(resource).not.toBeNull();
      expect(resource.id).toBeDefined();
      expect(resource.type).toBeDefined();
      expect(resource.name).toBeDefined();
      expect(resource.amount).toBeGreaterThanOrEqual(1);
      expect(resource.createdAt).toBeDefined();
      expect(resource.expiresAt).toBeGreaterThan(resource.createdAt);
    });

    test('在暴风雨天气下应该有更高概率生成特定资源', () => {
      // 多次生成资源以统计结果
      const resources = [];
      for (let i = 0; i < 100; i++) {
        resources.push(resourceManager.generateRandomResource('storm', false));
      }
      
      // 检查暴风雨特定资源的出现频率
      const stormSpecificResources = resources.filter(r => 
        ['metal', 'rope', 'tech_components'].includes(r.type)
      );
      
      // 暴风雨特定资源应该有更高的出现率
      expect(stormSpecificResources.length).toBeGreaterThan(20); // 至少20%的概率
    });

    test('应该能生成稀有资源', () => {
      const resource = resourceManager.generateRandomResource('clear', true);
      
      expect(resource).not.toBeNull();
      expect(resource.isRare).toBe(true);
      
      // 验证是否为稀有资源类型
      const rareTypes = Object.keys(resourceManager.rareResourceTypes);
      expect(rareTypes).toContain(resource.type);
    });
  });

  describe('generateWeatherSpecificResource', () => {
    test('应该根据天气生成特定资源', () => {
      // 模拟随机数生成以确保生成资源
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.1); // 低于生成阈值
      
      const resource = resourceManager.generateWeatherSpecificResource('heavyStorm');
      
      expect(resource).not.toBeNull();
      expect(resource.fromWeather).toBe('heavyStorm');
      
      // 验证是否为暴风雨特定资源类型
      const stormTypes = resourceManager.weatherSpecificResources.heavyStorm;
      expect(stormTypes).toContain(resource.type);
      
      // 恢复原始函数
      Math.random = originalRandom;
    });

    test('对于不存在的天气类型应返回null', () => {
      const resource = resourceManager.generateWeatherSpecificResource('nonexistent_weather');
      expect(resource).toBeNull();
    });

    test('有时即使是有效天气也可能不生成资源', () => {
      // 模拟随机数生成以确保不生成资源
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.9); // 高于生成阈值
      
      const resource = resourceManager.generateWeatherSpecificResource('foggy');
      expect(resource).toBeNull();
      
      // 恢复原始函数
      Math.random = originalRandom;
    });
  });

  describe('isResourceExpired', () => {
    test('应该正确识别过期资源', () => {
      const now = Date.now();
      const expiredResource = {
        expiresAt: now - 1000 // 已过期
      };
      
      const isExpired = resourceManager.isResourceExpired(expiredResource, now);
      expect(isExpired).toBe(true);
    });

    test('应该正确识别未过期资源', () => {
      const now = Date.now();
      const validResource = {
        expiresAt: now + 10000 // 未过期
      };
      
      const isExpired = resourceManager.isResourceExpired(validResource, now);
      expect(isExpired).toBe(false);
    });
  });

  describe('calculateTradeValue', () => {
    test('应该计算基础资源的正确交易价值', () => {
      const value = resourceManager.calculateTradeValue('wood', 5);
      expect(value).toBe(5); // 木材基础价值为1，5个木材价值为5
    });

    test('应该为稀有或贵重物品提供价值加成', () => {
      const value = resourceManager.calculateTradeValue('valuable_item', 1);
      expect(value).toBeGreaterThan(resourceManager.resourceTypes['valuable_item'].baseValue);
    });

    test('对于不存在的资源类型应返回0', () => {
      const value = resourceManager.calculateTradeValue('nonexistent_resource');
      expect(value).toBe(0);
    });
  });

  describe('consumeResources', () => {
    test('应该正确消耗资源', () => {
      const inventory = { wood: 10, plastic: 5 };
      const resources = { wood: 3, plastic: 2 };
      
      const result = resourceManager.consumeResources(inventory, resources);
      
      expect(result).toBe(true);
      expect(inventory.wood).toBe(7);
      expect(inventory.plastic).toBe(3);
    });

    test('当资源不足时不应消耗资源', () => {
      const inventory = { wood: 2, plastic: 5 };
      const resources = { wood: 3, plastic: 2 };
      
      const result = resourceManager.consumeResources(inventory, resources);
      
      expect(result).toBe(false);
      expect(inventory.wood).toBe(2); // 不应改变
      expect(inventory.plastic).toBe(5); // 不应改变
    });
  });
});