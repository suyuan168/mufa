/**
 * Game Module
 * Core game logic and rendering
 */
import WeatherEffects from './weather.js';
import LocationManager from './locations.js';
import NPCManager from './npc.js';

const Game = (() => {
  // Canvas and context
  let canvas;
  let ctx;
  
  // Game state
  let isRunning = false;
  let isPaused = false;
  let socket;
  let gameTime = 0;
  let lastFrameTime = 0;
  let playerPosition = { x: 0, y: 0 };
  let cameraOffset = { x: 0, y: 0 };
  let raftSize = 1;
  let resources = {
    wood: 0,
    plastic: 0,
    metal: 0,
    food: 10,
    water: 10
  };
  let hookActive = false;
  let hookPosition = { x: 0, y: 0 };
  let hookTarget = null;
  let hookExtending = false;
  let hookMaxLength = 300;
  let hookLength = 0;
  let floatingResources = [];
  let otherPlayers = new Map();
  let playerItems = [];
  let sharks = new Map();
  
  // Assets
  const assets = {};
  const assetSources = {
    raft: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="%23a5673f" stroke="%23513526" stroke-width="2"/><rect x="10" y="30" width="80" height="40" fill="%23b5774f" stroke="%23513526" stroke-width="1"/><line x1="10" y1="50" x2="90" y2="50" stroke="%23513526" stroke-width="1"/><line x1="30" y1="10" x2="30" y2="90" stroke="%23513526" stroke-width="1"/><line x1="50" y1="10" x2="50" y2="90" stroke="%23513526" stroke-width="1"/><line x1="70" y1="10" x2="70" y2="90" stroke="%23513526" stroke-width="1"/></svg>',
    wood: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" rx="2" fill="%23a5673f" stroke="%23513526" stroke-width="2"/></svg>',
    plastic: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" rx="2" fill="%23b3e5fc" stroke="%231e88e5" stroke-width="2"/></svg>',
    metal: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><polygon points="20,5 5,20 10,35 30,35 35,20" fill="%23b0bec5" stroke="%23546e7a" stroke-width="2"/></svg>',
    food: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="%238bc34a" stroke="%23558b2f" stroke-width="2"/></svg>',
    water: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20,5 C13,15 8,25 8,30 C8,36 13,40 20,40 C27,40 32,36 32,30 C32,25 27,15 20,5 Z" fill="%232196f3" stroke="%230d47a1" stroke-width="2"/></svg>',
    player: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 50"><circle cx="15" cy="12" r="10" fill="%23ffb74d" stroke="%23f57c00" stroke-width="2"/><rect x="10" y="22" width="10" height="20" fill="%23ffb74d" stroke="%23f57c00" stroke-width="0"/><rect x="5" y="25" width="20" height="15" rx="2" fill="%23f57c00" stroke="%23e65100" stroke-width="2"/><rect x="10" y="40" width="4" height="10" fill="%234b0082" stroke="%23e65100" stroke-width="1"/><rect x="16" y="40" width="4" height="10" fill="%234b0082" stroke="%23e65100" stroke-width="1"/></svg>',
    shark: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><path d="M75,20 C75,10 65,5 50,5 C35,5 20,10 10,15 C0,20 0,25 5,30 C10,35 20,35 30,32 C35,30 38,25 40,20 C42,25 45,30 50,32 C60,35 70,30 75,20 Z" fill="%23546e7a" stroke="%23263238" stroke-width="2"/><circle cx="15" cy="15" r="3" fill="white"/><circle cx="15" cy="15" r="1" fill="black"/><path d="M60,25 L75,30 L60,35" fill="%23546e7a" stroke="%23263238" stroke-width="2"/></svg>',
    spear: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><rect x="5" y="8" width="90" height="4" fill="%23a5673f"/><polygon points="2,5 8,10 2,15" fill="%23b0bec5" stroke="%23546e7a" stroke-width="1"/></svg>'
  };
  
  // Game constants
  const PLAYER_SPEED = 100;
  const HOOK_SPEED = 300;
  const RESOURCE_SIZE = 30;
  const RAFT_BASE_SIZE = 60;
  
  // Preload image assets
  const loadAssets = () => {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const totalAssets = Object.keys(assetSources).length;
      
      for (const [key, source] of Object.entries(assetSources)) {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          
          // Update loading progress
          const progress = Math.floor((loadedCount / totalAssets) * 100);
          UI.showLoading(progress, `加载资源 (${loadedCount}/${totalAssets})`);
          
          if (loadedCount === totalAssets) {
            resolve();
          }
        };
        img.src = source;
        assets[key] = img;
      }
    });
  };
  
  // Connect to game server via WebSocket
  const connectToServer = () => {
    return new Promise((resolve, reject) => {
      try {
        socket = io();
        
        socket.on('connect', () => {
          console.log('Connected to server');
          
          // Authenticate with token
          const token = Auth.getToken();
          socket.emit('auth', { token });
          
          UI.showLoading(90, '正在加载游戏数据...');
        });
        
        socket.on('game:init', (data) => {
          // Initialize game state with server data
          const { player, resources: worldResources, players } = data;
          
          raftSize = player.gameProgress.raftSize;
          resources = { ...player.gameProgress.resources };
          playerItems = [...player.gameProgress.items];
          floatingResources = [...worldResources];
          
          // Initialize other players
          otherPlayers.clear();
          players.forEach(p => {
            if (p.userId !== player.id) {
              otherPlayers.set(p.socketId, p);
            }
          });
          
          // Update UI with resources
          UI.updateResources(resources);
          
          resolve();
        });
        
        socket.on('player:joined', (player) => {
          // Add new player to the game
          otherPlayers.set(player.socketId, player);
        });
        
        socket.on('player:left', (socketId) => {
          // Remove player from the game
          otherPlayers.delete(socketId);
        });
        
        socket.on('player:position', (data) => {
          // Update other player's position
          const { id, position } = data;
          if (otherPlayers.has(id)) {
            const player = otherPlayers.get(id);
            player.position = position;
          }
        });
        
        socket.on('resource:spawn', (resource) => {
          // Add new resource to the game
          floatingResources.push(resource);
        });
        
        socket.on('resource:collected', (data) => {
          // Remove collected resource from the game
          const { resourceId, playerId, playerName } = data;
          
          floatingResources = floatingResources.filter(r => r.id !== resourceId);
          
          // Show notification if another player collected it
          if (playerId !== socket.id) {
            UI.showNotification(`${playerName} 收集了一个资源`);
          }
        });
        
        socket.on('player:resources', (updatedResources) => {
          // Update player's resources
          resources = { ...updatedResources };
          UI.updateResources(resources);
        });
        
        socket.on('craft:success', (data) => {
          // Update player's game progress
          resources = { ...data.gameProgress.resources };
          playerItems = [...data.gameProgress.items];
          raftSize = data.gameProgress.raftSize;
          
          UI.updateResources(resources);
          UI.showNotification('物品制作成功');
        });
        
        socket.on('craft:failed', (data) => {
          UI.showNotification(`制作失败: ${data.message}`);
        });
        
        socket.on('player:raft_upgraded', (data) => {
          const { playerId, newSize } = data;
          
          if (playerId === socket.id) {
            // Update own raft size
            raftSize = newSize;
            UI.showNotification(`木筏扩展至 ${newSize} 级`);
          } else if (otherPlayers.has(playerId)) {
            // Update other player's raft size
            const player = otherPlayers.get(playerId);
            player.raftSize = newSize;
            UI.showNotification(`${player.nickname} 扩展了他的木筏`);
          }
        });
        
        socket.on('shark:spawn', (sharkData) => {
          addShark(sharkData);
        });
        
        socket.on('shark:attack', (data) => {
          onSharkAttack(data);
        });
        
        socket.on('shark:damaged', (data) => {
          if (sharks.has(data.sharkId)) {
            // 更新鲨鱼血量
            sharks.get(data.sharkId).health = data.remainingHealth;
            
            // 如果是当前玩家造成的伤害，显示提示
            if (data.attackerId === socket.id) {
              UI.showNotification(`对鲨鱼造成 ${data.damage} 点伤害！`, 2000);
            }
          }
        });
        
        socket.on('shark:death', (data) => {
          removeShark(data.sharkId);
        });
        
        socket.on('game:state', (state) => {
          // 更新鲨鱼状态
          if (state.sharks) {
            state.sharks.forEach(sharkData => {
              if (sharks.has(sharkData.id)) {
                updateShark(sharkData);
              } else {
                addShark(sharkData);
              }
            });
          }
          
          // 可能还有其他需要更新的状态...
        });
        
        socket.on('disconnect', () => {
          console.log('Disconnected from server');
          UI.showNotification('与服务器的连接已断开，请重新加载游戏', 5000);
          isPaused = true;
        });
      } catch (error) {
        console.error('Socket connection error:', error);
        reject(error);
      }
    });
  };
  
  // Main game loop
  const gameLoop = (timestamp) => {
    if (!isRunning) return;
    
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Skip updates if game is paused
    if (!isPaused) {
      gameTime += deltaTime;
      
      // Update game state
      update(deltaTime / 1000);
    }
    
    // Render game
    render();
    
    // Request next frame
    requestAnimationFrame(gameLoop);
  };
  
  // Update game state
  const update = (deltaTime) => {
    // Update player position based on joystick input
    const moveDirection = Controls.getDirection();
    playerPosition.x += moveDirection.x * PLAYER_SPEED * deltaTime;
    playerPosition.y += moveDirection.y * PLAYER_SPEED * deltaTime;
    
    // Send position update to server
    socket.emit('player:move', playerPosition);
    
    // Update camera position to follow player
    cameraOffset.x = canvas.width / 2 - playerPosition.x;
    cameraOffset.y = canvas.height / 2 - playerPosition.y;
    
    // Update hook position if active
    if (hookActive) {
      updateHook(deltaTime);
    }
    
    // Check for resource collection
    checkResourceCollection();
    
    // 更新天气效果
    weather.update(deltaTime);
    
    // 更新位置
    locations.update(deltaTime);
    
    // 更新NPC
    npcs.update(deltaTime);
  };
  
  // Update hook position and state
  const updateHook = (deltaTime) => {
    if (hookExtending) {
      // Extend hook
      hookLength += HOOK_SPEED * deltaTime;
      
      // Calculate hook position
      const angle = Math.atan2(hookTarget.y - playerPosition.y, hookTarget.x - playerPosition.x);
      hookPosition.x = playerPosition.x + Math.cos(angle) * hookLength;
      hookPosition.y = playerPosition.y + Math.sin(angle) * hookLength;
      
      // Check if hook reached target
      const distance = Math.sqrt(
        Math.pow(hookTarget.x - hookPosition.x, 2) +
        Math.pow(hookTarget.y - hookPosition.y, 2)
      );
      
      if (distance < 10 || hookLength >= hookMaxLength) {
        // Start retracting hook
        hookExtending = false;
      }
    } else {
      // Retract hook
      hookLength -= HOOK_SPEED * 1.5 * deltaTime;
      
      // Calculate hook position
      const angle = Math.atan2(hookTarget.y - playerPosition.y, hookTarget.x - playerPosition.x);
      hookPosition.x = playerPosition.x + Math.cos(angle) * hookLength;
      hookPosition.y = playerPosition.y + Math.sin(angle) * hookLength;
      
      // Check if hook is back
      if (hookLength <= 0) {
        hookActive = false;
      }
    }
  };
  
  // Check if hook intersects with any resources
  const checkResourceCollection = () => {
    if (!hookActive || hookExtending) return;
    
    // Check each resource
    for (let i = 0; i < floatingResources.length; i++) {
      const resource = floatingResources[i];
      
      // Calculate distance between hook and resource
      const distance = Math.sqrt(
        Math.pow(resource.position.x - hookPosition.x, 2) +
        Math.pow(resource.position.y - hookPosition.y, 2)
      );
      
      // If hook is close to resource, collect it
      if (distance < RESOURCE_SIZE) {
        // Notify server about resource collection
        socket.emit('resource:collect', resource.id);
        
        // Remove resource from local array
        floatingResources.splice(i, 1);
        
        // Show notification
        UI.showNotification(`收集了 ${getResourceName(resource.type)}`);
        
        // No need to check further resources
        break;
      }
    }
  };
  
  // Get translated resource name
  const getResourceName = (type) => {
    const names = {
      wood: '木头',
      plastic: '塑料',
      metal: '金属',
      food: '食物',
      water: '水'
    };
    
    return names[type] || type;
  };
  
  // Render game
  const render = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ocean background
    drawOcean();
    
    // Draw resources
    drawResources();
    
    // Draw other players
    drawOtherPlayers();
    
    // Draw player raft
    drawPlayerRaft();
    
    // Draw player
    drawPlayer();
    
    // Draw hook if active
    if (hookActive) {
      drawHook();
    }
    
    // Draw sharks
    drawSharks();
    
    // 绘制天气背景效果 (海面、云层等)
    weather.render();
    
    // 应用相机变换
    ctx.save();
    ctx.translate(-cameraOffset.x, -cameraOffset.y);
    
    // 绘制位置 (岛屿、沉船等)
    locations.render();
    
    // 绘制NPC (商人、海盗等)
    npcs.render();
    
    // 恢复相机变换
    ctx.restore();
    
    // Draw UI elements
    drawUI();
  };
  
  // Draw ocean background
  const drawOcean = () => {
    // Draw water tiles with parallax effect
    const tileSize = 100;
    const parallaxFactor = 0.2;
    
    // Calculate visible area based on camera position
    const startX = Math.floor((-cameraOffset.x * parallaxFactor) / tileSize) - 1;
    const startY = Math.floor((-cameraOffset.y * parallaxFactor) / tileSize) - 1;
    const endX = startX + Math.ceil(canvas.width / tileSize) + 2;
    const endY = startY + Math.ceil(canvas.height / tileSize) + 2;
    
    // Draw water tiles
    ctx.fillStyle = '#0a3b5e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0c4a76';
    
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Create a subtle wave pattern
        const offsetX = Math.sin(gameTime / 1000 + x + y) * 5;
        const offsetY = Math.cos(gameTime / 1500 + x - y) * 5;
        
        const posX = x * tileSize + cameraOffset.x * parallaxFactor + offsetX;
        const posY = y * tileSize + cameraOffset.y * parallaxFactor + offsetY;
        
        // Only draw if positions are even (checkerboard pattern)
        if ((x + y) % 2 === 0) {
          ctx.fillRect(posX, posY, tileSize, tileSize);
        }
      }
    }
  };
  
  // Draw player raft
  const drawPlayerRaft = () => {
    const raftWidth = RAFT_BASE_SIZE * Math.sqrt(raftSize);
    const raftHeight = RAFT_BASE_SIZE * Math.sqrt(raftSize);
    
    const x = playerPosition.x + cameraOffset.x - raftWidth / 2;
    const y = playerPosition.y + cameraOffset.y - raftHeight / 2;
    
    ctx.drawImage(assets.raft, x, y, raftWidth, raftHeight);
  };
  
  // Draw player character
  const drawPlayer = () => {
    const playerSize = 30;
    const x = playerPosition.x + cameraOffset.x - playerSize / 2;
    const y = playerPosition.y + cameraOffset.y - playerSize;
    
    ctx.drawImage(assets.player, x, y, playerSize, playerSize * 1.67);
  };
  
  // Draw other players
  const drawOtherPlayers = () => {
    for (const player of otherPlayers.values()) {
      // Draw player's raft
      const raftWidth = RAFT_BASE_SIZE * Math.sqrt(player.raftSize);
      const raftHeight = RAFT_BASE_SIZE * Math.sqrt(player.raftSize);
      
      const raftX = player.position.x + cameraOffset.x - raftWidth / 2;
      const raftY = player.position.y + cameraOffset.y - raftHeight / 2;
      
      ctx.drawImage(assets.raft, raftX, raftY, raftWidth, raftHeight);
      
      // Draw player character
      const playerSize = 30;
      const playerX = player.position.x + cameraOffset.x - playerSize / 2;
      const playerY = player.position.y + cameraOffset.y - playerSize;
      
      ctx.drawImage(assets.player, playerX, playerY, playerSize, playerSize * 1.67);
      
      // Draw player name
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.nickname, player.position.x + cameraOffset.x, player.position.y + cameraOffset.y - playerSize - 10);
    }
  };
  
  // Draw floating resources
  const drawResources = () => {
    for (const resource of floatingResources) {
      const x = resource.position.x + cameraOffset.x - RESOURCE_SIZE / 2;
      const y = resource.position.y + cameraOffset.y - RESOURCE_SIZE / 2;
      
      // Add bobbing effect
      const bobAmplitude = 3;
      const bobOffset = Math.sin(gameTime / 500 + resource.id.charCodeAt(0)) * bobAmplitude;
      
      // Draw resource
      if (assets[resource.type]) {
        ctx.drawImage(assets[resource.type], x, y + bobOffset, RESOURCE_SIZE, RESOURCE_SIZE);
      }
    }
  };
  
  // Draw hook and line
  const drawHook = () => {
    // Draw line from player to hook
    ctx.beginPath();
    ctx.moveTo(playerPosition.x + cameraOffset.x, playerPosition.y + cameraOffset.y - 10);
    ctx.lineTo(hookPosition.x + cameraOffset.x, hookPosition.y + cameraOffset.y);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw hook
    ctx.beginPath();
    ctx.arc(hookPosition.x + cameraOffset.x, hookPosition.y + cameraOffset.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ccc';
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // Draw sharks
  const drawSharks = () => {
    for (const shark of sharks.values()) {
      drawShark(shark);
    }
  };
  
  // Draw single shark
  const drawShark = (shark) => {
    const sharkSize = 60;
    const x = shark.position.x + cameraOffset.x - sharkSize / 2;
    const y = shark.position.y + cameraOffset.y - sharkSize / 4;
    
    // Apply transparency based on shark health
    ctx.globalAlpha = shark.health <= 30 ? 0.7 : 1;
    
    // Save current context
    ctx.save();
    
    // Translate to shark's center
    ctx.translate(shark.position.x + cameraOffset.x, shark.position.y + cameraOffset.y);
    
    // Rotate based on shark's direction
    if (shark.direction) {
      const angle = Math.atan2(shark.direction.y, shark.direction.x);
      ctx.rotate(angle);
    }
    
    // Draw shark
    ctx.drawImage(assets.shark, -sharkSize / 2, -sharkSize / 4, sharkSize, sharkSize / 2);
    
    // Restore context
    ctx.restore();
    
    // If shark is damaged, draw health bar
    if (shark.health < 100) {
      // Draw health bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y - 10, sharkSize, 5);
      
      // Draw health bar
      const healthPercent = shark.health / 100;
      ctx.fillStyle = healthPercent > 0.5 ? 'green' : healthPercent > 0.25 ? 'orange' : 'red';
      ctx.fillRect(x, y - 10, sharkSize * healthPercent, 5);
    }
    
    // If shark is attacking, draw attack indicator
    if (shark.state === 'attacking') {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(shark.position.x + cameraOffset.x, shark.position.y + cameraOffset.y - 25, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset transparency
    ctx.globalAlpha = 1;
  };
  
  // Start using hook
  const startHook = () => {
    if (hookActive) return;
    
    hookActive = true;
    hookExtending = true;
    hookLength = 0;
    
    // Calculate hook target (in front of player based on joystick direction)
    const direction = Controls.getDirection();
    
    // Use joystick direction if available, otherwise use default direction
    if (Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1) {
      hookTarget = {
        x: playerPosition.x + direction.x * hookMaxLength,
        y: playerPosition.y + direction.y * hookMaxLength
      };
    } else {
      // Default to right direction if no joystick input
      hookTarget = {
        x: playerPosition.x + hookMaxLength,
        y: playerPosition.y
      };
    }
  };
  
  // Stop using hook
  const stopHook = () => {
    if (!hookActive || !hookExtending) return;
    
    hookExtending = false;
  };
  
  // Craft item
  const craftItem = (itemType) => {
    let cost = {};
    
    switch (itemType) {
      case 'raft_upgrade':
        cost = { wood: 10, plastic: 5 };
        break;
      case 'fishing_rod':
        cost = { wood: 4, plastic: 2 };
        break;
      case 'water_purifier':
        cost = { plastic: 6, metal: 4 };
        break;
      case 'spear':
        cost = { wood: 3, metal: 2 };
        break;
    }
    
    // Send craft request to server
    socket.emit('craft:item', { itemType, cost });
  };
  
  // Get current resources
  const getResources = () => {
    return { ...resources };
  };
  
  // Get game data for saving
  const getGameData = () => {
    return {
      resources,
      raftSize,
      items: playerItems,
      level: 1 // Placeholder for future level system
    };
  };
  
  // Initialize game
  const init = async () => {
    try {
      // Get canvas context
      canvas = document.getElementById('game-canvas');
      ctx = canvas.getContext('2d');
      
      // Set canvas size
      resizeCanvas();
      
      // Listen for window resize
      window.addEventListener('resize', resizeCanvas);
      
      // Show loading screen
      UI.showLoading(0, '正在加载资源...');
      
      // Load assets
      await loadAssets();
      
      // Connect to server
      await connectToServer();
      
      // Initialize controls
      Controls.init();
      
      // Start game loop
      isRunning = true;
      lastFrameTime = performance.now();
      requestAnimationFrame(gameLoop);
      
      // Show game screen
      UI.showScreen('game');
      
      UI.showNotification('木筏生存游戏已加载完成', 3000);
      
      // Initialize interactions
      initInteractions();
      
      // 初始化天气系统
      weather = new WeatherEffects(this);
      
      // 初始化位置管理器
      locations = new LocationManager(this);
      
      // 初始化NPC管理器
      npcs = new NPCManager(this);
    } catch (error) {
      console.error('Game initialization error:', error);
      UI.showNotification('游戏加载失败，请刷新页面重试', 5000);
    }
  };
  
  // Resize canvas to fit window
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  // Pause game
  const pause = () => {
    isPaused = true;
  };
  
  // Resume game
  const resume = () => {
    isPaused = false;
    lastFrameTime = performance.now();
  };
  
  // Add shark
  const addShark = (sharkData) => {
    sharks.set(sharkData.id, {
      ...sharkData,
      // Ensure direction is set, if server doesn't provide use default
      direction: sharkData.direction || { x: 1, y: 0 }
    });
    
    // Show notification
    UI.showNotification('鲨鱼出现了！小心！', 3000);
  };
  
  // Update shark
  const updateShark = (sharkData) => {
    if (sharks.has(sharkData.id)) {
      const shark = sharks.get(sharkData.id);
      
      // Update position and state
      shark.position = sharkData.position;
      shark.state = sharkData.state;
      shark.health = sharkData.health;
      
      // If direction information is available, update direction
      if (sharkData.direction) {
        shark.direction = sharkData.direction;
      }
    }
  };
  
  // Remove shark
  const removeShark = (sharkId) => {
    if (sharks.has(sharkId)) {
      sharks.delete(sharkId);
      UI.showNotification('鲨鱼被击败了！', 3000);
    }
  };
  
  // Attack shark
  const attackShark = (sharkId) => {
    if (!sharks.has(sharkId)) return;
    
    // Get current equipped weapon
    const activeWeapon = getActiveWeapon();
    const damage = activeWeapon ? activeWeapon.damage : 5; // Default damage
    
    // Send attack request to server
    socket.emit('shark:attack', {
      sharkId,
      damage,
      weaponType: activeWeapon ? activeWeapon.type : 'hand'
    });
    
    // Play attack animation
    playAttackAnimation(sharks.get(sharkId).position);
  };
  
  // Get current equipped weapon
  const getActiveWeapon = () => {
    // In actual implementation, this should be retrieved from player equipment slots or inventory
    // Here it's simplified to return default weapon
    return {
      type: 'spear',
      damage: 15
    };
  };
  
  // Play attack animation
  const playAttackAnimation = (targetPosition) => {
    // Create a temporary element for animation
    const animElement = document.createElement('div');
    animElement.className = 'attack-animation';
    document.body.appendChild(animElement);
    
    // Set position
    const x = targetPosition.x + cameraOffset.x;
    const y = targetPosition.y + cameraOffset.y;
    animElement.style.left = `${x}px`;
    animElement.style.top = `${y}px`;
    
    // Add animation effect class
    animElement.classList.add('active');
    
    // Remove element after animation ends
    setTimeout(() => {
      document.body.removeChild(animElement);
    }, 500);
  };
  
  // Handle shark attack event
  const onSharkAttack = (data) => {
    const { sharkId, targetId, damage, remainingHealth } = data;
    
    // If attack is on current player
    if (targetId === socket.id) {
      UI.showNotification(`鲨鱼攻击了你的木筏！损失 ${damage} 点耐久度`, 3000);
      
      // Update raft health UI
      updateRaftHealth(remainingHealth);
      
      // Play damage animation
      playDamageAnimation();
    }
  };
  
  // Update raft health UI
  const updateRaftHealth = (health) => {
    // In actual implementation, should be displayed in UI
    // Could use health bar or other methods
  };
  
  // Play damage animation
  const playDamageAnimation = () => {
    // Add red flash effect to canvas
    canvas.classList.add('damage-flash');
    
    // Remove animation class
    setTimeout(() => {
      canvas.classList.remove('damage-flash');
    }, 300);
  };
  
  // Initialize interactions
  const initInteractions = () => {
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouchStart);
  };
  
  // Handle canvas click event
  const handleCanvasClick = (event) => {
    // Get click coordinates
    const clickX = event.clientX;
    const clickY = event.clientY;
    
    // Check if clicked on shark
    checkSharkClick(clickX, clickY);
  };
  
  // Handle canvas touch event
  const handleCanvasTouchStart = (event) => {
    // Get touch coordinates
    const touch = event.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // Check if touched on shark
    checkSharkClick(touchX, touchY);
  };
  
  // Check if clicked/touched on shark
  const checkSharkClick = (x, y) => {
    // Iterate through all sharks
    for (const [id, shark] of sharks.entries()) {
      // Calculate shark's position on screen
      const sharkScreenX = shark.position.x + cameraOffset.x;
      const sharkScreenY = shark.position.y + cameraOffset.y;
      
      // Check if clicked within shark's range
      const distance = Math.sqrt(
        Math.pow(x - sharkScreenX, 2) + 
        Math.pow(y - sharkScreenY, 2)
      );
      
      // If clicked within range (using a reasonable click range, e.g., 40 pixels)
      if (distance < 40) {
        // Check if within attack range
        const playerDistance = Math.sqrt(
          Math.pow(playerPosition.x - shark.position.x, 2) + 
          Math.pow(playerPosition.y - shark.position.y, 2)
        );
        
        // Assume attack range is 100 units
        if (playerDistance <= 100) {
          // Attack shark
          attackShark(id);
        } else {
          UI.showNotification('鲨鱼超出攻击范围！', 2000);
        }
        
        return; // Exit loop after finding a shark
      }
    }
  };
  
  // Calculate player attack damage
  const calculateAttackDamage = () => {
    // Base damage
    let damage = 10;
    
    // Adjust damage based on equipment
    if (player && player.equipment) {
      if (player.equipment.weapon === 'spear') {
        damage = 15;
      } else if (player.equipment.weapon === 'metal_spear') {
        damage = 25;
      }
    }
    
    // Add random variation (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    damage = Math.round(damage * randomFactor);
    
    return damage;
  };
  
  // Update player inventory
  const updateInventory = (items, isDecrement = false) => {
    if (!player || !player.inventory) return;
    
    for (const item of items) {
      const itemType = item.type;
      const amount = item.amount || item.quantity || 1;
      
      if (!player.inventory[itemType]) {
        player.inventory[itemType] = 0;
      }
      
      if (isDecrement) {
        player.inventory[itemType] = Math.max(0, player.inventory[itemType] - amount);
      } else {
        player.inventory[itemType] += amount;
      }
    }
    
    // Update UI
    if (gameUI && gameUI.updateInventoryUI) {
      gameUI.updateInventoryUI(player.inventory);
    }
    
    // Sync with server
    socket.emit('player:inventory_update', {
      inventory: player.inventory
    });
  };
  
  // Public methods
  return {
    init,
    startHook,
    stopHook,
    getResources,
    getGameData,
    craftItem,
    pause,
    resume,
    get isRunning() {
      return isRunning;
    },
    calculateAttackDamage,
    updateInventory
  };
})();

export default Game; 