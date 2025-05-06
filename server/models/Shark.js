/**
 * 鲨鱼敌人模型
 * 用于追踪和攻击玩家的木筏
 */
class Shark {
  constructor(id, position, gameRoom) {
    this.id = id;
    this.position = position || { x: 0, y: 0 };
    this.speed = 80; // 移动速度
    this.targetRaft = null; // 目标木筏
    this.state = 'patrolling'; // patrolling, attacking, retreating
    this.health = 100;
    this.damage = 10; // 攻击木筏造成的伤害
    this.attackCooldown = 5000; // 攻击冷却时间(ms)
    this.lastAttackTime = 0;
    this.gameRoom = gameRoom; // 所属游戏房间引用
  }

  // 更新鲨鱼状态
  update(deltaTime) {
    switch (this.state) {
      case 'patrolling':
        this.patrol(deltaTime);
        break;
      case 'attacking':
        this.attack(deltaTime);
        break;
      case 'retreating':
        this.retreat(deltaTime);
        break;
    }

    // 检查是否有玩家在附近
    this.checkForPlayers();
  }

  // 巡逻模式 - 在区域内随机移动
  patrol(deltaTime) {
    // 每10秒更换一次方向
    if (!this.patrolTimer) {
      this.patrolTimer = 0;
      this.setRandomDirection();
    }

    this.patrolTimer += deltaTime;
    if (this.patrolTimer > 10) {
      this.patrolTimer = 0;
      this.setRandomDirection();
    }

    // 按当前方向移动
    this.position.x += this.direction.x * this.speed * (deltaTime / 1000);
    this.position.y += this.direction.y * this.speed * (deltaTime / 1000);

    // 确保鲨鱼不会游出游戏区域
    this.constrainToGameArea();
  }

  // 设置随机移动方向
  setRandomDirection() {
    const angle = Math.random() * 2 * Math.PI;
    this.direction = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  // 确保鲨鱼不会游出游戏区域
  constrainToGameArea() {
    const GAME_BOUNDS = 2000; // 游戏区域大小
    
    if (Math.abs(this.position.x) > GAME_BOUNDS) {
      this.position.x = Math.sign(this.position.x) * GAME_BOUNDS;
      this.direction.x *= -1;
    }
    
    if (Math.abs(this.position.y) > GAME_BOUNDS) {
      this.position.y = Math.sign(this.position.y) * GAME_BOUNDS;
      this.direction.y *= -1;
    }
  }

  // 检查附近是否有玩家
  checkForPlayers() {
    // 获取游戏房间中的所有玩家
    const players = this.gameRoom.getActivePlayers();
    let closestRaft = null;
    let minDistance = 800; // 检测范围

    for (const player of players) {
      // 计算与玩家的距离
      const distance = Math.sqrt(
        Math.pow(this.position.x - player.position.x, 2) + 
        Math.pow(this.position.y - player.position.y, 2)
      );

      // 如果有玩家在检测范围内且距离更近
      if (distance < minDistance) {
        minDistance = distance;
        closestRaft = player;
      }
    }

    // 如果找到目标，切换到攻击模式
    if (closestRaft) {
      this.targetRaft = closestRaft;
      this.state = 'attacking';
    }
  }

  // 攻击模式 - 追逐并攻击玩家木筏
  attack(deltaTime) {
    // 如果没有目标或目标不再活跃，返回巡逻模式
    if (!this.targetRaft || !this.gameRoom.isPlayerActive(this.targetRaft.id)) {
      this.state = 'patrolling';
      this.targetRaft = null;
      return;
    }

    // 向目标移动
    const dx = this.targetRaft.position.x - this.position.x;
    const dy = this.targetRaft.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 计算方向向量
    this.direction = {
      x: dx / distance,
      y: dy / distance
    };

    // 以更快的速度追逐
    const attackSpeed = this.speed * 1.5;
    this.position.x += this.direction.x * attackSpeed * (deltaTime / 1000);
    this.position.y += this.direction.y * attackSpeed * (deltaTime / 1000);

    // 如果接近木筏，进行攻击
    if (distance < 50) {
      this.performAttack();
    }

    // 如果距离过远，返回巡逻模式
    if (distance > 1000) {
      this.state = 'patrolling';
      this.targetRaft = null;
    }
  }

  // 执行攻击
  performAttack() {
    const now = Date.now();
    // 检查攻击冷却时间
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    // 记录攻击时间
    this.lastAttackTime = now;

    // 通知游戏房间鲨鱼攻击事件
    this.gameRoom.onSharkAttack(this, this.targetRaft, this.damage);

    // 攻击后短暂撤退
    this.state = 'retreating';
    this.retreatTimer = 0;
  }

  // 撤退模式 - 攻击后短暂远离
  retreat(deltaTime) {
    if (!this.retreatTimer) {
      this.retreatTimer = 0;
      
      // 从目标方向相反方向撤退
      if (this.targetRaft) {
        const dx = this.position.x - this.targetRaft.position.x;
        const dy = this.position.y - this.targetRaft.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.direction = {
          x: dx / distance,
          y: dy / distance
        };
      } else {
        this.setRandomDirection();
      }
    }

    // 撤退计时
    this.retreatTimer += deltaTime;
    
    // 撤退移动
    this.position.x += this.direction.x * this.speed * (deltaTime / 1000);
    this.position.y += this.direction.y * this.speed * (deltaTime / 1000);

    // 撤退3秒后回到巡逻状态
    if (this.retreatTimer > 3) {
      this.state = 'patrolling';
      this.retreatTimer = 0;
    }
  }

  // 当被玩家攻击
  takeDamage(amount) {
    this.health -= amount;
    
    // 如果生命值低于 30%，有机会逃跑
    if (this.health < 30 && Math.random() < 0.3) {
      this.state = 'retreating';
      this.retreatTimer = 0;
    }
    
    // 如果死亡，通知游戏房间
    if (this.health <= 0) {
      this.gameRoom.onSharkDeath(this);
    }
    
    return this.health;
  }

  // 获取鲨鱼数据用于发送给客户端
  getClientData() {
    return {
      id: this.id,
      position: this.position,
      state: this.state,
      health: this.health
    };
  }
}

module.exports = Shark; 