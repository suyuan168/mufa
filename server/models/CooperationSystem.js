/**
 * 多人协作系统
 * 管理玩家之间的互动和协作机制
 */
class CooperationSystem {
  constructor() {
    // 协作任务类型
    this.taskTypes = {
      'raft_building': {
        name: '木筏建造',
        description: '共同建造或升级木筏',
        minPlayers: 1,
        optimalPlayers: 2,
        timeReduction: 0.3, // 每增加一名玩家减少30%的时间
        maxTimeReduction: 0.7 // 最多减少70%的时间
      },
      'resource_gathering': {
        name: '资源收集',
        description: '共同收集漂浮资源',
        minPlayers: 1,
        optimalPlayers: 3,
        efficiencyBoost: 0.2, // 每增加一名玩家提高20%的效率
        maxEfficiencyBoost: 0.6 // 最多提高60%的效率
      },
      'shark_defense': {
        name: '鲨鱼防御',
        description: '共同抵御鲨鱼攻击',
        minPlayers: 1,
        optimalPlayers: 2,
        damageReduction: 0.25, // 每增加一名玩家减少25%的伤害
        maxDamageReduction: 0.75 // 最多减少75%的伤害
      },
      'island_exploration': {
        name: '岛屿探索',
        description: '共同探索岛屿',
        minPlayers: 1,
        optimalPlayers: 3,
        discoveryBoost: 0.2, // 每增加一名玩家提高20%的发现几率
        maxDiscoveryBoost: 0.6 // 最多提高60%的发现几率
      },
      'cooking': {
        name: '食物烹饪',
        description: '共同烹饪食物',
        minPlayers: 1,
        optimalPlayers: 2,
        qualityBoost: 0.15, // 每增加一名玩家提高15%的食物质量
        maxQualityBoost: 0.45 // 最多提高45%的食物质量
      }
    };
    
    // 玩家角色专长
    this.playerRoles = {
      'builder': {
        name: '建造者',
        description: '擅长建造和修理木筏',
        bonuses: {
          'raft_building': 0.2, // 建造速度+20%
          'repair_efficiency': 0.3 // 修理效率+30%
        }
      },
      'gatherer': {
        name: '收集者',
        description: '擅长收集和发现资源',
        bonuses: {
          'resource_gathering': 0.25, // 资源收集效率+25%
          'resource_detection': 0.3 // 资源探测范围+30%
        }
      },
      'hunter': {
        name: '猎人',
        description: '擅长战斗和防御',
        bonuses: {
          'shark_defense': 0.3, // 防御效率+30%
          'weapon_damage': 0.25 // 武器伤害+25%
        }
      },
      'explorer': {
        name: '探险家',
        description: '擅长探索和发现',
        bonuses: {
          'island_exploration': 0.3, // 探索效率+30%
          'navigation': 0.25 // 导航效率+25%
        }
      },
      'cook': {
        name: '厨师',
        description: '擅长烹饪和医疗',
        bonuses: {
          'cooking': 0.3, // 烹饪效率+30%
          'medical_efficiency': 0.25 // 医疗效率+25%
        }
      }
    };
    
    // 协作状态记录
    this.activeCooperations = new Map();
  }
  
  /**
   * 创建协作任务
   * @param {string} taskId - 任务ID
   * @param {string} taskType - 任务类型
   * @param {string} initiatorId - 发起者ID
   * @param {Object} taskData - 任务数据
   * @returns {Object} 创建的任务
   */
  createCooperativeTask(taskId, taskType, initiatorId, taskData = {}) {
    if (!this.taskTypes[taskType]) {
      return { success: false, message: '未知任务类型' };
    }
    
    const taskInfo = this.taskTypes[taskType];
    const now = Date.now();
    
    const task = {
      id: taskId,
      type: taskType,
      name: taskInfo.name,
      description: taskInfo.description,
      initiator: initiatorId,
      participants: [initiatorId],
      status: 'waiting', // waiting, in_progress, completed, failed
      startTime: null,
      endTime: null,
      createdAt: now,
      progress: 0,
      result: null,
      data: taskData
    };
    
    this.activeCooperations.set(taskId, task);
    
    return { success: true, task };
  }
  
  /**
   * 加入协作任务
   * @param {string} taskId - 任务ID
   * @param {string} playerId - 玩家ID
   * @param {string} playerRole - 玩家角色
   * @returns {Object} 结果
   */
  joinCooperativeTask(taskId, playerId, playerRole = null) {
    if (!this.activeCooperations.has(taskId)) {
      return { success: false, message: '任务不存在' };
    }
    
    const task = this.activeCooperations.get(taskId);
    
    // 检查任务是否已经开始或完成
    if (task.status !== 'waiting' && task.status !== 'in_progress') {
      return { success: false, message: `任务已${task.status === 'completed' ? '完成' : '失败'}，无法加入` };
    }
    
    // 检查玩家是否已经在任务中
    if (task.participants.includes(playerId)) {
      return { success: false, message: '已经加入该任务' };
    }
    
    // 添加玩家到参与者列表
    task.participants.push(playerId);
    
    // 如果提供了角色信息，记录玩家角色
    if (playerRole && this.playerRoles[playerRole]) {
      if (!task.playerRoles) {
        task.playerRoles = {};
      }
      task.playerRoles[playerId] = playerRole;
    }
    
    // 如果任务处于等待状态且已达到最小玩家数，自动开始任务
    if (task.status === 'waiting' && task.participants.length >= this.taskTypes[task.type].minPlayers) {
      task.status = 'in_progress';
      task.startTime = Date.now();
    }
    
    return { success: true, task };
  }
  
  /**
   * 离开协作任务
   * @param {string} taskId - 任务ID
   * @param {string} playerId - 玩家ID
   * @returns {Object} 结果
   */
  leaveCooperativeTask(taskId, playerId) {
    if (!this.activeCooperations.has(taskId)) {
      return { success: false, message: '任务不存在' };
    }
    
    const task = this.activeCooperations.get(taskId);
    
    // 检查任务是否已经完成或失败
    if (task.status === 'completed' || task.status === 'failed') {
      return { success: false, message: `任务已${task.status === 'completed' ? '完成' : '失败'}，无法离开` };
    }
    
    // 检查玩家是否在任务中
    const participantIndex = task.participants.indexOf(playerId);
    if (participantIndex === -1) {
      return { success: false, message: '未加入该任务' };
    }
    
    // 从参与者列表中移除玩家
    task.participants.splice(participantIndex, 1);
    
    // 如果有角色信息，移除玩家角色
    if (task.playerRoles && task.playerRoles[playerId]) {
      delete task.playerRoles[playerId];
    }
    
    // 如果发起者离开，任务失败
    if (playerId === task.initiator) {
      task.status = 'failed';
      task.endTime = Date.now();
      task.result = { message: '发起者离开，任务失败' };
      return { success: true, task, taskFailed: true };
    }
    
    // 如果没有足够的参与者，任务暂停
    if (task.participants.length < this.taskTypes[task.type].minPlayers) {
      task.status = 'waiting';
    }
    
    return { success: true, task };
  }
  
  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度值(0-100)
   * @param {Object} result - 任务结果
   * @returns {Object} 更新后的任务
   */
  updateTaskProgress(taskId, progress, result = null) {
    if (!this.activeCooperations.has(taskId)) {
      return { success: false, message: '任务不存在' };
    }
    
    const task = this.activeCooperations.get(taskId);
    
    // 检查任务是否正在进行
    if (task.status !== 'in_progress') {
      return { success: false, message: `任务当前状态为${task.status}，无法更新进度` };
    }
    
    // 更新进度
    task.progress = Math.min(100, Math.max(0, progress));
    
    // 如果进度达到100%，完成任务
    if (task.progress >= 100) {
      task.status = 'completed';
      task.endTime = Date.now();
      task.result = result || { message: '任务完成' };
    } else if (result) {
      // 如果提供了中间结果，更新结果
      task.result = result;
    }
    
    return { success: true, task };
  }
  
  /**
   * 计算协作效率
   * @param {Object} task - 任务对象
   * @returns {Object} 效率加成
   */
  calculateCooperationBonus(task) {
    if (!task || !this.taskTypes[task.type]) {
      return { bonus: 0 };
    }
    
    const taskInfo = this.taskTypes[task.type];
    const participantCount = task.participants.length;
    
    // 基础效率计算
    let bonus = 0;
    let bonusType = '';
    
    switch (task.type) {
      case 'raft_building':
        // 建造时间减少
        bonusType = 'timeReduction';
        bonus = Math.min(
          taskInfo.maxTimeReduction,
          (participantCount - 1) * taskInfo.timeReduction
        );
        break;
      case 'resource_gathering':
        // 资源收集效率提升
        bonusType = 'efficiencyBoost';
        bonus = Math.min(
          taskInfo.maxEfficiencyBoost,
          (participantCount - 1) * taskInfo.efficiencyBoost
        );
        break;
      case 'shark_defense':
        // 伤害减少
        bonusType = 'damageReduction';
        bonus = Math.min(
          taskInfo.maxDamageReduction,
          (participantCount - 1) * taskInfo.damageReduction
        );
        break;
      case 'island_exploration':
        // 发现几率提升
        bonusType = 'discoveryBoost';
        bonus = Math.min(
          taskInfo.maxDiscoveryBoost,
          (participantCount - 1) * taskInfo.discoveryBoost
        );
        break;
      case 'cooking':
        // 食物质量提升
        bonusType = 'qualityBoost';
        bonus = Math.min(
          taskInfo.maxQualityBoost,
          (participantCount - 1) * taskInfo.qualityBoost
        );
        break;
    }
    
    // 应用角色加成
    let roleBonus = 0;
    if (task.playerRoles) {
      for (const [playerId, role] of Object.entries(task.playerRoles)) {
        const roleInfo = this.playerRoles[role];
        if (roleInfo && roleInfo.bonuses[task.type]) {
          roleBonus += roleInfo.bonuses[task.type];
        }
      }
    }
    
    // 总效率 = 基础效率 + 角色加成
    const totalBonus = bonus + roleBonus;
    
    return {
      bonus: totalBonus,
      bonusType,
      baseBonus: bonus,
      roleBonus,
      participantCount,
      optimalCount: taskInfo.optimalPlayers
    };
  }
  
  /**
   * 获取任务信息
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务信息
   */
  getTaskInfo(taskId) {
    return this.activeCooperations.get(taskId) || null;
  }
  
  /**
   * 获取玩家参与的所有任务
   * @param {string} playerId - 玩家ID
   * @returns {Array} 任务列表
   */
  getPlayerTasks(playerId) {
    const playerTasks = [];
    
    for (const [taskId, task] of this.activeCooperations.entries()) {
      if (task.participants.includes(playerId)) {
        playerTasks.push(task);
      }
    }
    
    return playerTasks;
  }
  
  /**
   * 清理已完成或失败的任务
   * @param {number} maxAge - 最大保留时间(毫秒)
   * @returns {number} 清理的任务数量
   */
  cleanupTasks(maxAge = 3600000) { // 默认1小时
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [taskId, task] of this.activeCooperations.entries()) {
      if ((task.status === 'completed' || task.status === 'failed') && 
          task.endTime && (now - task.endTime > maxAge)) {
        this.activeCooperations.delete(taskId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * 获取任务类型信息
   * @param {string} taskType - 任务类型
   * @returns {Object|null} 任务类型信息
   */
  getTaskTypeInfo(taskType) {
    return this.taskTypes[taskType] || null;
  }
  
  /**
   * 获取所有任务类型
   * @returns {Array} 任务类型列表
   */
  getAllTaskTypes() {
    return Object.keys(this.taskTypes).map(type => ({
      type,
      ...this.taskTypes[type]
    }));
  }
  
  /**
   * 获取角色信息
   * @param {string} role - 角色类型
   * @returns {Object|null} 角色信息
   */
  getRoleInfo(role) {
    return this.playerRoles[role] || null;
  }
  
  /**
   * 获取所有角色类型
   * @returns {Array} 角色类型列表
   */
  getAllRoles() {
    return Object.keys(this.playerRoles).map(role => ({
      role,
      ...this.playerRoles[role]
    }));
  }
}

module.exports = CooperationSystem;