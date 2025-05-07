# 木筏生存游戏系统设计文档

## 概述

木筏生存游戏是一个多人联机H5沙盒生存游戏，玩家需要在海洋环境中建造木筏、收集资源、抵御危险并与其他玩家合作生存。本文档详细介绍了游戏的核心系统和功能设计。

## 核心系统

### 1. 木筏建造系统 (RaftBuilder)

木筏建造系统允许玩家建造、升级和维护自己的木筏。

**主要功能：**
- 多种木筏组件（基础平台、围墙、帆、储物箱等）
- 不同布局大小（小型、中型、大型、巨型）
- 组件耐久度和修理机制
- 木筏属性计算（速度、防御、存储容量等）

**组件示例：**
```javascript
'foundation': {
  name: '基础平台',
  description: '木筏的基础平台，提供站立和建造空间',
  cost: { wood: 4, plastic: 2 },
  durability: 100,
  size: 1,
  required: true
}
```

### 2. 资源管理系统 (ResourceManager)

资源管理系统负责游戏中各种资源的生成、收集和使用。

**主要功能：**
- 基础资源（木材、塑料、金属、绳索等）
- 稀有资源（稀有种子、蓝图、科技组件等）
- 天气特定资源（暴风雨时出现特殊资源）
- 资源漂浮和过期机制

**资源示例：**
```javascript
'wood': {
  name: '木材',
  description: '基础建筑材料，用于制作木筏和工具',
  baseValue: 1,
  weight: 1,
  stackSize: 20,
  floatTime: 300000, // 漂浮时间(毫秒)
  spawnWeight: 30 // 生成权重
}
```

### 3. 生存需求系统 (SurvivalSystem)

生存需求系统管理玩家的基本生存需求，如饥饿、口渴和健康状态。

**主要功能：**
- 饥饿和口渴机制
- 健康和体温系统
- 能量消耗
- 天气和时间对生存需求的影响
- 食物、水和医疗物品的消耗效果

**生存状态示例：**
```javascript
{
  hunger: 100,      // 饥饿值 (0-100)
  thirst: 100,     // 口渴值 (0-100)
  health: 100,     // 健康值 (0-100)
  temperature: 37, // 体温 (℃)
  energy: 100      // 能量值 (0-100)
}
```

### 4. 多人协作系统 (CooperationSystem)

多人协作系统鼓励玩家一起完成任务，提供协作加成。

**主要功能：**
- 协作任务（木筏建造、资源收集、鲨鱼防御等）
- 玩家角色专长（建造者、收集者、猎人等）
- 协作效率加成
- 任务进度和奖励机制

**协作任务示例：**
```javascript
'resource_gathering': {
  name: '资源收集',
  description: '共同收集漂浮资源',
  minPlayers: 1,
  optimalPlayers: 3,
  efficiencyBoost: 0.2, // 每增加一名玩家提高20%的效率
  maxEfficiencyBoost: 0.6 // 最多提高60%的效率
}
```

## 游戏流程

1. **初始阶段**
   - 玩家在一个小型木筏上开始游戏
   - 收集基础漂浮资源（木材、塑料等）
   - 扩建基础木筏平台

2. **发展阶段**
   - 建造更多木筏组件（储物箱、净水器、烤炉等）
   - 与其他玩家组队合作
   - 探索附近岛屿获取更多资源

3. **进阶阶段**
   - 升级木筏布局
   - 建造高级组件（雷达、引擎等）
   - 抵御鲨鱼和恶劣天气
   - 与NPC交易获取稀有物品

## 技术实现

游戏基于Socket.io实现实时多人交互，主要处理器包括：

1. **raftHandler.js** - 处理木筏建造和资源收集
2. **locationHandler.js** - 处理位置交互和探索
3. **npcHandler.js** - 处理NPC交互和交易

游戏房间(GameRoom)负责管理游戏状态，包括：
- 玩家管理
- 资源生成
- 天气系统
- 生存状态更新
- 协作任务

## 未来扩展

1. **工具和武器系统** - 允许玩家制作工具和武器
2. **种植系统** - 在木筏上种植作物
3. **深海探索** - 潜水获取海底资源
4. **任务系统** - 更复杂的任务和成就
5. **木筏装饰** - 个性化木筏外观

## 开发指南

### 添加新组件

在RaftBuilder.js中的componentTypes对象中添加新组件：

```javascript
'new_component': {
  name: '新组件名称',
  description: '组件描述',
  cost: { resource1: amount1, resource2: amount2 },
  durability: 100,
  // 其他属性...
}
```

### 添加新资源

在ResourceManager.js中的resourceTypes对象中添加新资源：

```javascript
'new_resource': {
  name: '新资源名称',
  description: '资源描述',
  baseValue: 5,
  weight: 1,
  stackSize: 10,
  floatTime: 180000,
  spawnWeight: 10
}
```

### 添加新协作任务

在CooperationSystem.js中的taskTypes对象中添加新任务：

```javascript
'new_task': {
  name: '新任务名称',
  description: '任务描述',
  minPlayers: 2,
  optimalPlayers: 4,
  // 任务特定属性...
}
```