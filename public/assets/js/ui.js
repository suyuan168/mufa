/**
 * UI 管理模块
 * 负责处理界面显示、切换和交互
 */
const UI = (() => {
  // 所有屏幕列表
  const screens = {
    login: document.getElementById('login-screen'),
    room: document.getElementById('room-screen'),
    game: document.getElementById('game-screen')
  };
  
  // 游戏中的UI元素
  let gameCanvas;
  let resourcesPanel;
  let gameControls;
  let notificationArea;
  let loadingScreen;
  
  // 显示指定屏幕
  const showScreen = (screenId) => {
    if (!screens[screenId]) {
      console.error(`屏幕 ${screenId} 不存在`);
      return;
    }
    
    // 隐藏所有屏幕
    Object.values(screens).forEach(screen => {
      if (screen) {
        screen.style.display = 'none';
      }
    });
    
    // 显示目标屏幕
    screens[screenId].style.display = 'flex';
    
    console.log(`切换到屏幕: ${screenId}`);
    
    // 如果是游戏屏幕，初始化游戏UI
    if (screenId === 'game') {
      initGameUI();
    }
  };
  
  // 初始化游戏UI元素
  const initGameUI = () => {
    // 已经初始化过则跳过
    if (gameControls) return;
    
    gameCanvas = document.getElementById('game-canvas');
    
    // 创建资源面板
    resourcesPanel = document.createElement('div');
    resourcesPanel.className = 'resources-panel';
    resourcesPanel.innerHTML = `
      <div class="player-stats">
        <div class="health-bar">
          <div class="health-fill" style="width: 100%"></div>
        </div>
        <div class="hunger-bar">
          <div class="hunger-fill" style="width: 80%"></div>
        </div>
        <div class="thirst-bar">
          <div class="thirst-fill" style="width: 90%"></div>
        </div>
      </div>
      <div class="resources">
        <div class="resource">
          <div class="resource-icon wood-icon"></div>
          <span class="resource-count">0</span>
        </div>
        <div class="resource">
          <div class="resource-icon plastic-icon"></div>
          <span class="resource-count">0</span>
        </div>
        <div class="resource">
          <div class="resource-icon metal-icon"></div>
          <span class="resource-count">0</span>
        </div>
      </div>
    `;
    
    // 创建控制按钮
    gameControls = document.createElement('div');
    gameControls.className = 'game-controls';
    gameControls.innerHTML = `
      <div id="joystick-container">
        <div id="joystick-base">
          <div id="joystick-knob"></div>
        </div>
      </div>
      <div class="action-buttons">
        <button class="action-button" id="hook-btn">钩子</button>
        <button class="action-button" id="build-btn">建造</button>
        <button class="action-button" id="attack-btn">攻击</button>
      </div>
      <div class="menu-buttons">
        <button class="menu-button" id="inventory-btn">📦</button>
        <button class="menu-button" id="craft-btn">🔨</button>
        <button class="menu-button" id="map-btn">🗺️</button>
        <button class="menu-button" id="chat-btn">💬</button>
      </div>
    `;
    
    // 创建通知区域
    notificationArea = document.createElement('div');
    notificationArea.className = 'notification-area';
    
    // 将UI元素添加到游戏屏幕
    const gameScreen = screens.game;
    gameScreen.appendChild(resourcesPanel);
    gameScreen.appendChild(gameControls);
    gameScreen.appendChild(notificationArea);
    
    // 初始化摇杆控制
    initJoystick();
  };
  
  // 初始化虚拟摇杆控制
  const initJoystick = () => {
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    
    if (!joystickBase || !joystickKnob) return;
    
    let isJoystickActive = false;
    let joystickBaseRect = joystickBase.getBoundingClientRect();
    let centerX = joystickBaseRect.width / 2;
    let centerY = joystickBaseRect.height / 2;
    let maxDistance = joystickBaseRect.width / 2;
    
    // 摇杆开始事件
    const joystickStart = (e) => {
      isJoystickActive = true;
      joystickBaseRect = joystickBase.getBoundingClientRect();
      centerX = joystickBaseRect.width / 2;
      centerY = joystickBaseRect.height / 2;
      
      // 阻止默认行为和冒泡
      e.preventDefault();
      e.stopPropagation();
    };
    
    // 摇杆移动事件
    const joystickMove = (e) => {
      if (!isJoystickActive) return;
      
      // 获取触摸或鼠标坐标
      let clientX, clientY;
      if (e.type.includes('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // 计算相对于摇杆基座的位置
      let relX = clientX - joystickBaseRect.left;
      let relY = clientY - joystickBaseRect.top;
      
      // 计算与中心的距离和角度
      let deltaX = relX - centerX;
      let deltaY = relY - centerY;
      let distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
      let angle = Math.atan2(deltaY, deltaX);
      
      // 计算摇杆位置
      let knobX = centerX + distance * Math.cos(angle);
      let knobY = centerY + distance * Math.sin(angle);
      
      // 设置摇杆位置
      joystickKnob.style.transform = `translate(${knobX - joystickKnob.offsetWidth/2}px, ${knobY - joystickKnob.offsetHeight/2}px)`;
      
      // 计算移动方向和速度
      const moveDirection = {
        x: distance * Math.cos(angle) / maxDistance,
        y: distance * Math.sin(angle) / maxDistance
      };
      
      // 发送移动指令到游戏
      if (Game && typeof Game.movePlayer === 'function') {
        Game.movePlayer(moveDirection.x, moveDirection.y);
      }
      
      // 阻止默认行为和冒泡
      e.preventDefault();
      e.stopPropagation();
    };
    
    // 摇杆结束事件
    const joystickEnd = (e) => {
      if (!isJoystickActive) return;
      
      isJoystickActive = false;
      joystickKnob.style.transform = 'translate(0, 0)';
      
      // 通知游戏停止移动
      if (Game && typeof Game.movePlayer === 'function') {
        Game.movePlayer(0, 0);
      }
      
      // 阻止默认行为和冒泡
      e.preventDefault();
      e.stopPropagation();
    };
    
    // 添加触摸事件监听器
    joystickBase.addEventListener('touchstart', joystickStart, { passive: false });
    document.addEventListener('touchmove', joystickMove, { passive: false });
    document.addEventListener('touchend', joystickEnd, { passive: false });
    
    // 添加鼠标事件监听器（用于桌面测试）
    joystickBase.addEventListener('mousedown', joystickStart);
    document.addEventListener('mousemove', joystickMove);
    document.addEventListener('mouseup', joystickEnd);
  };
  
  // 更新资源显示
  const updateResources = (resources) => {
    if (!resourcesPanel) return;
    
    const woodCount = resourcesPanel.querySelector('.wood-icon + .resource-count');
    const plasticCount = resourcesPanel.querySelector('.plastic-icon + .resource-count');
    const metalCount = resourcesPanel.querySelector('.metal-icon + .resource-count');
    
    if (woodCount) woodCount.textContent = resources.wood || 0;
    if (plasticCount) plasticCount.textContent = resources.plastic || 0;
    if (metalCount) metalCount.textContent = resources.metal || 0;
  };
  
  // 更新玩家状态
  const updatePlayerStats = (stats) => {
    if (!resourcesPanel) return;
    
    const healthFill = resourcesPanel.querySelector('.health-fill');
    const hungerFill = resourcesPanel.querySelector('.hunger-fill');
    const thirstFill = resourcesPanel.querySelector('.thirst-fill');
    
    if (healthFill) {
      healthFill.style.width = `${stats.health}%`;
      
      // 根据生命值改变颜色
      if (stats.health < 25) {
        healthFill.classList.add('danger');
        healthFill.classList.remove('warning');
      } else if (stats.health < 50) {
        healthFill.classList.add('warning');
        healthFill.classList.remove('danger');
      } else {
        healthFill.classList.remove('danger', 'warning');
      }
    }
    
    if (hungerFill) hungerFill.style.width = `${stats.hunger}%`;
    if (thirstFill) thirstFill.style.width = `${stats.thirst}%`;
  };
  
  // 显示通知
  const showNotification = (message, type = 'info') => {
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationArea.appendChild(notification);
    
    // 添加显示动画类
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 3秒后自动移除
    setTimeout(() => {
      notification.classList.remove('show');
      
      // 动画结束后移除元素
      notification.addEventListener('transitionend', () => {
        notificationArea.removeChild(notification);
      });
    }, 3000);
  };
  
  // 显示加载屏幕
  const showLoading = (message = '加载中...') => {
    if (!loadingScreen) {
      loadingScreen = document.createElement('div');
      loadingScreen.className = 'loading-screen';
      loadingScreen.innerHTML = `
        <div class="loading-container">
          <h2>木筏生存</h2>
          <div class="loading-bar">
            <div class="loading-progress"></div>
          </div>
          <div class="loading-text">${message}</div>
        </div>
      `;
      document.body.appendChild(loadingScreen);
    } else {
      loadingScreen.querySelector('.loading-text').textContent = message;
      loadingScreen.style.display = 'flex';
    }
  };
  
  // 隐藏加载屏幕
  const hideLoading = () => {
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  };
  
  // 设置加载进度
  const setLoadingProgress = (percent) => {
    if (loadingScreen) {
      const progressBar = loadingScreen.querySelector('.loading-progress');
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
    }
  };
  
  // 初始化UI模块
  const init = () => {
    console.log('UI模块初始化...');
    
    // 初始化时先显示登录页面
    showScreen('login');
    
    // 设置窗口调整事件处理
    window.addEventListener('resize', () => {
      // 重新计算游戏画布大小
      if (gameCanvas) {
        gameCanvas.width = window.innerWidth;
        gameCanvas.height = window.innerHeight;
        
        // 通知游戏画布大小变化
        if (Game && typeof Game.onResize === 'function') {
          Game.onResize(gameCanvas.width, gameCanvas.height);
        }
      }
    });
    
    console.log('UI模块初始化完成');
  };
  
  // 返回公共API
  return {
    init,
    showScreen,
    updateResources,
    updatePlayerStats,
    showNotification,
    showLoading,
    hideLoading,
    setLoadingProgress
  };
})(); 