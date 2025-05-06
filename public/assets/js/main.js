/**
 * Main Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  UI.init();
  
  // Simulate loading process
  const loadingProgress = [0, 20, 45, 70, 90, 100];
  const loadingMessages = [
    '初始化游戏...',
    '加载资源...',
    '准备木筏...',
    '生成海洋...',
    '完成加载',
    '准备开始!'
  ];
  
  let currentStep = 0;
  
  const simulateLoading = () => {
    if (currentStep < loadingProgress.length) {
      UI.showLoading(loadingProgress[currentStep], loadingMessages[currentStep]);
      currentStep++;
      
      setTimeout(simulateLoading, 500);
    } else {
      // Check if user is logged in
      if (Auth.isLoggedIn()) {
        // Initialize game
        Game.init();
      } else {
        // Show auth screen
        UI.showScreen('auth');
      }
      
      // Initialize auth module
      Auth.init();
    }
  };
  
  // Start loading simulation
  simulateLoading();
  
  // Prevent scrolling on mobile
  document.addEventListener('touchmove', (e) => {
    if (e.target.tagName !== 'INPUT') {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Disable context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause game when tab is not active
      if (Game.isRunning) {
        Game.pause();
      }
    } else {
      // Resume game when tab becomes active again
      if (Game.isRunning) {
        Game.resume();
      }
    }
  });
});

/**
 * 主应用初始化模块
 * 负责协调各个子模块的加载和初始化
 */
const App = (() => {
  // 初始化函数
  const init = () => {
    console.log('木筏生存游戏初始化中...');
    
    // 1. 初始化UI模块
    if (UI && typeof UI.init === 'function') {
      UI.init();
    } else {
      console.error('UI模块未正确加载');
    }
    
    // 2. 初始化Auth模块
    if (Auth && typeof Auth.init === 'function') {
      Auth.init();
    } else {
      console.error('Auth模块未正确加载');
    }
    
    // 3. 设置单人模式按钮事件
    const singlePlayerBtn = document.getElementById('single-player-btn');
    if (singlePlayerBtn) {
      singlePlayerBtn.addEventListener('click', () => {
        // 创建单人游戏
        Game.createSinglePlayerGame();
        UI.showScreen('game');
      });
    }
    
    // 4. 设置创建房间按钮事件
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', () => {
        // 创建多人游戏房间
        Game.createMultiPlayerRoom();
        UI.showScreen('game');
      });
    }
    
    // 5. 设置加入房间按钮事件
    const joinRoomBtn = document.getElementById('join-room-btn');
    const joinRoomForm = document.getElementById('join-room-form');
    const roomList = document.getElementById('room-list');
    
    if (joinRoomBtn && joinRoomForm && roomList) {
      joinRoomBtn.addEventListener('click', () => {
        joinRoomForm.style.display = 'block';
        roomList.style.display = 'block';
        
        // 加载可用房间列表
        Game.fetchAvailableRooms((rooms) => {
          // 清空现有列表
          roomList.innerHTML = '';
          
          if (rooms.length === 0) {
            roomList.innerHTML = '<p>当前没有可用的房间，请创建一个新房间</p>';
            return;
          }
          
          // 创建房间列表
          const roomsHtml = rooms.map(room => {
            return `<div class="room-item" data-id="${room.id}">
              <span class="room-name">房间 #${room.id}</span>
              <span class="room-players">${room.players.length}/${room.maxPlayers}人</span>
              <button class="join-room-btn" data-id="${room.id}">加入</button>
            </div>`;
          }).join('');
          
          roomList.innerHTML = roomsHtml;
          
          // 为每个加入按钮添加事件
          document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const roomId = e.target.getAttribute('data-id');
              Game.joinRoom(roomId);
              UI.showScreen('game');
            });
          });
        });
      });
    }
    
    // 6. 确认加入房间按钮事件
    const confirmJoinBtn = document.getElementById('confirm-join-btn');
    const roomIdInput = document.getElementById('room-id-input');
    
    if (confirmJoinBtn && roomIdInput) {
      confirmJoinBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
          Game.joinRoom(roomId);
          UI.showScreen('game');
        }
      });
    }
    
    console.log('木筏生存游戏初始化完成！');
  };
  
  // 在页面加载完成后初始化应用
  window.addEventListener('DOMContentLoaded', init);
  
  // 返回公共API
  return {
    init
  };
})();

// 启动应用
window.App = App; 