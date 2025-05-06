/**
 * 玩家管理器
 * 管理玩家数据和游戏进度
 */
const { User } = require('./User');

class PlayerManager {
  constructor() {
    this.playerCache = new Map(); // 缓存玩家数据以减少数据库查询
    this.cacheTTL = 5 * 60 * 1000; // 缓存有效期 (5分钟)
  }
  
  // 获取玩家数据
  async getPlayerById(userId) {
    try {
      // 检查缓存
      if (this.playerCache.has(userId)) {
        const cachedPlayer = this.playerCache.get(userId);
        if (Date.now() - cachedPlayer.timestamp < this.cacheTTL) {
          return cachedPlayer.data;
        }
      }
      
      // 从数据库获取玩家数据
      const user = await User.findByPk(userId);
      if (!user) return null;
      
      // 更新缓存
      this.playerCache.set(userId, {
        data: user,
        timestamp: Date.now()
      });
      
      return user;
    } catch (error) {
      console.error('获取玩家数据错误:', error);
      return null;
    }
  }
  
  // 保存玩家游戏进度
  async savePlayerProgress(userId, gameProgress) {
    try {
      // 从数据库获取玩家数据
      let user = await User.findByPk(userId);
      if (!user) return false;
      
      // 更新游戏进度
      user.gameProgress = gameProgress;
      await user.save();
      
      // 更新缓存
      if (this.playerCache.has(userId)) {
        const cachedPlayer = this.playerCache.get(userId);
        cachedPlayer.data.gameProgress = gameProgress;
        cachedPlayer.timestamp = Date.now();
      }
      
      return true;
    } catch (error) {
      console.error('保存玩家进度错误:', error);
      return false;
    }
  }
  
  // 清理缓存中过期的数据
  cleanupCache() {
    const now = Date.now();
    for (const [userId, cachedPlayer] of this.playerCache.entries()) {
      if (now - cachedPlayer.timestamp > this.cacheTTL) {
        this.playerCache.delete(userId);
      }
    }
  }
  
  // 获取玩家成就进度
  async getPlayerAchievements(userId) {
    try {
      const user = await this.getPlayerById(userId);
      if (!user) return null;
      
      return user.gameProgress.achievements || {};
    } catch (error) {
      console.error('获取玩家成就进度错误:', error);
      return null;
    }
  }
  
  // 更新玩家成就
  async updatePlayerAchievement(userId, achievementId, progress) {
    try {
      const user = await this.getPlayerById(userId);
      if (!user) return false;
      
      // 确保成就字段存在
      if (!user.gameProgress.achievements) {
        user.gameProgress.achievements = {};
      }
      
      // 更新指定成就的进度
      user.gameProgress.achievements[achievementId] = progress;
      
      // 保存游戏进度
      return this.savePlayerProgress(userId, user.gameProgress);
    } catch (error) {
      console.error('更新玩家成就错误:', error);
      return false;
    }
  }
  
  // 更新玩家职业
  async updatePlayerClass(userId, playerClass) {
    try {
      const user = await this.getPlayerById(userId);
      if (!user) return false;
      
      // 更新玩家职业
      user.gameProgress.playerClass = playerClass;
      
      // 保存游戏进度
      return this.savePlayerProgress(userId, user.gameProgress);
    } catch (error) {
      console.error('更新玩家职业错误:', error);
      return false;
    }
  }
  
  // 添加物品到玩家库存
  async addItemToInventory(userId, itemType, amount = 1) {
    try {
      const user = await this.getPlayerById(userId);
      if (!user) return false;
      
      // 确保库存字段存在
      if (!user.gameProgress.inventory) {
        user.gameProgress.inventory = {};
      }
      
      // 更新物品数量
      if (!user.gameProgress.inventory[itemType]) {
        user.gameProgress.inventory[itemType] = 0;
      }
      user.gameProgress.inventory[itemType] += amount;
      
      // 保存游戏进度
      return this.savePlayerProgress(userId, user.gameProgress);
    } catch (error) {
      console.error('添加物品到库存错误:', error);
      return false;
    }
  }
}

module.exports = PlayerManager; 