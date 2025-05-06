/**
 * 天气系统 - 客户端效果
 * 处理天气和昼夜效果的视觉和游戏逻辑
 */
class WeatherEffects {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    
    // 当前天气
    this.currentWeather = 'clear';
    this.weatherEffects = {};
    
    // 当前时间
    this.currentTimePhase = 'day';
    this.timeOfDay = 720; // 默认中午12点
    
    // 粒子系统
    this.particles = [];
    this.maxParticles = 200;
    
    // 滤镜效果
    this.filters = {
      brightness: 1.0,
      contrast: 1.0,
      blur: 0,
      overlay: null
    };
    
    // 预加载图像
    this.images = {};
    this.loadImages();
    
    // 音效
    this.sounds = {};
    this.loadSounds();
    
    // 雾层
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = this.canvas.width;
    this.fogCanvas.height = this.canvas.height;
    this.fogCtx = this.fogCanvas.getContext('2d');
    
    // 波浪效果参数
    this.waveAmplitude = 5;
    this.waveFrequency = 0.02;
    this.waveSpeed = 0.05;
    this.waveOffset = 0;
    
    // 初始化
    this.init();
  }
  
  // 初始化
  init() {
    // 创建canvas叠加层用于特效
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = this.canvas.width;
    this.overlayCanvas.height = this.canvas.height;
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    
    // 设置默认天气
    this.setWeather('clear');
    this.setTimePhase('day');
    
    // 监听天气变化事件
    this.game.socket.on('weather:change', data => {
      this.onWeatherChange(data);
    });
    
    // 监听时间变化事件
    this.game.socket.on('time:change', data => {
      this.onTimeChange(data);
    });
  }
  
  // 预加载图像
  loadImages() {
    const imageList = {
      'raindrop': '/assets/images/weather/raindrop.png',
      'snowflake': '/assets/images/weather/snowflake.png',
      'lightning': '/assets/images/weather/lightning.png',
      'cloud': '/assets/images/weather/cloud.png',
      'fog': '/assets/images/weather/fog.png',
      'sun': '/assets/images/weather/sun.png',
      'moon': '/assets/images/weather/moon.png'
    };
    
    for (const [key, src] of Object.entries(imageList)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  }
  
  // 预加载音效
  loadSounds() {
    const soundList = {
      'rain': '/assets/audio/fx/rain.mp3',
      'thunder': '/assets/audio/fx/thunder.mp3',
      'wind': '/assets/audio/fx/wind.mp3',
      'waves': '/assets/audio/fx/waves.mp3',
      'storm': '/assets/audio/fx/storm.mp3'
    };
    
    for (const [key, src] of Object.entries(soundList)) {
      const sound = new Audio(src);
      sound.loop = true;
      sound.volume = 0;
      this.sounds[key] = sound;
    }
  }
  
  // 处理天气变化
  onWeatherChange(data) {
    console.log('天气变化:', data);
    this.setWeather(data.type, data.effects);
  }
  
  // 处理时间变化
  onTimeChange(data) {
    console.log('时间变化:', data);
    this.setTimePhase(data.phase, data.timeOfDay, data.visibility);
  }
  
  // 设置天气
  setWeather(type, effects = {}) {
    // 停止所有当前天气音效
    for (const sound of Object.values(this.sounds)) {
      this.fadeSound(sound, 0, 1000);
    }
    
    // 清除现有粒子
    this.particles = [];
    
    // 应用新天气
    this.currentWeather = type;
    this.weatherEffects = effects || {};
    
    // 根据天气类型调整参数
    switch (type) {
      case 'clear':
        this.filters.brightness = 1.0;
        this.filters.contrast = 1.0;
        this.filters.blur = 0;
        this.waveAmplitude = 5;
        break;
        
      case 'cloudy':
        this.filters.brightness = 0.9;
        this.filters.contrast = 0.95;
        this.filters.blur = 0;
        this.waveAmplitude = 8;
        this.playSound('wind', 0.1);
        break;
        
      case 'foggy':
        this.filters.brightness = 0.85;
        this.filters.contrast = 0.9;
        this.filters.blur = 1;
        this.waveAmplitude = 6;
        this.playSound('wind', 0.15);
        break;
        
      case 'storm':
        this.filters.brightness = 0.7;
        this.filters.contrast = 1.1;
        this.filters.blur = 0;
        this.waveAmplitude = 15;
        this.generateRainParticles();
        this.playSound('rain', 0.3);
        this.playSound('wind', 0.25);
        this.playSound('waves', 0.4);
        
        // 随机闪电
        this.startLightningEffect();
        break;
        
      case 'heavyStorm':
        this.filters.brightness = 0.6;
        this.filters.contrast = 1.2;
        this.filters.blur = 0;
        this.waveAmplitude = 25;
        this.generateRainParticles(true); // 密集雨
        this.playSound('rain', 0.6);
        this.playSound('wind', 0.5);
        this.playSound('storm', 0.7);
        this.playSound('waves', 0.8);
        
        // 频繁闪电
        this.startLightningEffect(true);
        break;
    }
  }
  
  // 设置时间阶段
  setTimePhase(phase, timeOfDay, visibility) {
    this.currentTimePhase = phase;
    if (timeOfDay !== undefined) {
      this.timeOfDay = timeOfDay;
    }
    
    // 根据时间阶段调整参数
    switch (phase) {
      case 'day':
        // 白天亮度正常
        this.filters.brightness = Math.min(1.0, this.filters.brightness + 0.3);
        this.filters.overlay = null;
        break;
        
      case 'dawn':
        // 黎明偏橙色
        this.filters.brightness = Math.min(0.9, this.filters.brightness + 0.1);
        this.filters.overlay = 'rgba(255, 200, 150, 0.15)';
        break;
        
      case 'dusk':
        // 黄昏偏红色
        this.filters.brightness = Math.min(0.85, this.filters.brightness);
        this.filters.overlay = 'rgba(255, 150, 100, 0.2)';
        break;
        
      case 'night':
        // 夜晚较暗，蓝色调
        this.filters.brightness = Math.min(0.7, this.filters.brightness - 0.1);
        this.filters.overlay = 'rgba(50, 50, 150, 0.3)';
        break;
    }
  }
  
  // 生成雨粒子
  generateRainParticles(heavy = false) {
    const count = heavy ? this.maxParticles : Math.floor(this.maxParticles * 0.6);
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        length: heavy ? 20 + Math.random() * 15 : 10 + Math.random() * 10,
        speed: heavy ? 15 + Math.random() * 10 : 10 + Math.random() * 5,
        thickness: heavy ? 2 + Math.random() * 1 : 1 + Math.random() * 0.5,
        type: 'rain'
      });
    }
  }
  
  // 启动闪电效果
  startLightningEffect(frequent = false) {
    const minInterval = frequent ? 3000 : 8000;
    const maxInterval = frequent ? 10000 : 20000;
    
    const createLightning = () => {
      // 闪电特效
      const flash = () => {
        this.filters.brightness = 1.5;
        
        // 播放雷声
        const thunder = this.sounds['thunder'];
        thunder.currentTime = 0;
        thunder.volume = frequent ? 0.7 : 0.5;
        thunder.play();
        
        // 恢复正常亮度
        setTimeout(() => {
          this.filters.brightness = this.currentWeather === 'heavyStorm' ? 0.6 : 0.7;
        }, 100);
      };
      
      flash();
      
      // 可能的二次闪光
      if (Math.random() < 0.3) {
        setTimeout(flash, 200);
      }
      
      // 安排下一次闪电
      const nextInterval = minInterval + Math.random() * (maxInterval - minInterval);
      setTimeout(createLightning, nextInterval);
    };
    
    // 首次闪电延迟
    const initialDelay = 2000 + Math.random() * 3000;
    setTimeout(createLightning, initialDelay);
  }
  
  // 播放音效
  playSound(name, volume = 0.5, fadeTime = 1000) {
    if (!this.sounds[name]) return;
    
    const sound = this.sounds[name];
    sound.currentTime = 0;
    
    // 渐入音量
    this.fadeSound(sound, volume, fadeTime);
  }
  
  // 音量渐变
  fadeSound(sound, targetVolume, duration) {
    const startVolume = sound.volume;
    const volumeDiff = targetVolume - startVolume;
    const startTime = performance.now();
    
    if (targetVolume > 0 && sound.paused) {
      sound.play().catch(e => console.error('音频播放失败:', e));
    }
    
    const updateVolume = () => {
      const elapsed = performance.now() - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      
      sound.volume = startVolume + volumeDiff * ratio;
      
      if (ratio < 1) {
        requestAnimationFrame(updateVolume);
      } else if (targetVolume === 0 && !sound.paused) {
        sound.pause();
      }
    };
    
    updateVolume();
  }
  
  // 更新天气效果
  update(deltaTime) {
    this.updateWaves(deltaTime);
    this.updateParticles(deltaTime);
  }
  
  // 更新水波效果
  updateWaves(deltaTime) {
    // 更新波浪偏移量
    this.waveOffset += this.waveSpeed * deltaTime;
    
    // 根据天气调整波浪高度
    if (this.currentWeather === 'storm') {
      this.waveAmplitude = Math.min(this.waveAmplitude + 0.01 * deltaTime, 20);
    } else if (this.currentWeather === 'heavyStorm') {
      this.waveAmplitude = Math.min(this.waveAmplitude + 0.02 * deltaTime, 30);
    } else if (this.waveAmplitude > 5) {
      this.waveAmplitude = Math.max(this.waveAmplitude - 0.005 * deltaTime, 5);
    }
  }
  
  // 更新粒子效果
  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      if (p.type === 'rain') {
        p.y += p.speed * deltaTime;
        p.x -= p.speed * 0.5 * deltaTime; // 雨有一定角度
        
        // 如果雨滴离开屏幕，重置位置
        if (p.y > this.canvas.height) {
          p.y = 0;
          p.x = Math.random() * this.canvas.width;
        }
      }
    }
  }
  
  // 绘制天气效果
  render() {
    // 绘制天气滤镜
    this.applyWeatherFilters();
    
    // 绘制波浪效果
    this.renderWaves();
    
    // 绘制粒子效果
    this.renderParticles();
    
    // 绘制雾效果
    if (this.currentWeather === 'foggy') {
      this.renderFog();
    }
    
    // 绘制天空物体(太阳/月亮)
    this.renderCelestialBody();
    
    // 绘制闪电 (如果有)
    if (this.currentWeather === 'storm' || this.currentWeather === 'heavyStorm') {
      this.renderLightning();
    }
  }
  
  // 应用天气滤镜
  applyWeatherFilters() {
    // 应用亮度/对比度
    this.ctx.filter = `brightness(${this.filters.brightness}) contrast(${this.filters.contrast})`;
    
    // 应用颜色叠加
    if (this.filters.overlay) {
      this.overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.overlayCtx.fillStyle = this.filters.overlay;
      this.overlayCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'overlay';
      this.ctx.drawImage(this.overlayCanvas, 0, 0);
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }
  
  // 绘制波浪效果
  renderWaves() {
    const waterHeight = this.canvas.height * 0.65; // 水面高度
    this.ctx.save();
    
    // 设置波浪渐变
    let waterGradient;
    
    switch (this.currentTimePhase) {
      case 'day':
        waterGradient = this.ctx.createLinearGradient(0, waterHeight, 0, this.canvas.height);
        waterGradient.addColorStop(0, '#1976D2');
        waterGradient.addColorStop(1, '#0D47A1');
        break;
      case 'dawn':
      case 'dusk':
        waterGradient = this.ctx.createLinearGradient(0, waterHeight, 0, this.canvas.height);
        waterGradient.addColorStop(0, '#1565C0');
        waterGradient.addColorStop(1, '#0D47A1');
        break;
      case 'night':
        waterGradient = this.ctx.createLinearGradient(0, waterHeight, 0, this.canvas.height);
        waterGradient.addColorStop(0, '#0D47A1');
        waterGradient.addColorStop(1, '#1A237E');
        break;
    }
    
    // 绘制海面
    this.ctx.fillStyle = waterGradient;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, waterHeight);
    
    // 绘制波浪图形
    for (let x = 0; x < this.canvas.width; x += 10) {
      const y = waterHeight + Math.sin((x + this.waveOffset) * this.waveFrequency) * this.waveAmplitude;
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.lineTo(this.canvas.width, waterHeight);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.lineTo(0, this.canvas.height);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  // 绘制粒子效果
  renderParticles() {
    this.ctx.save();
    
    for (const p of this.particles) {
      if (p.type === 'rain') {
        this.ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
        this.ctx.lineWidth = p.thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.length * 0.5, p.y + p.length);
        this.ctx.stroke();
      }
    }
    
    this.ctx.restore();
  }
  
  // 绘制雾效果
  renderFog() {
    this.ctx.save();
    
    // 清除雾Canvas
    this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);
    
    // 创建雾效果
    const fogOpacity = this.currentWeather === 'foggy' ? 0.4 : 0.2;
    this.fogCtx.fillStyle = `rgba(200, 200, 255, ${fogOpacity})`;
    
    // 绘制多层雾
    for (let i = 0; i < 3; i++) {
      const yPos = this.canvas.height * 0.4 + i * 100 + Math.sin(this.waveOffset * 0.2) * 10;
      const height = 150 + i * 50;
      
      this.fogCtx.beginPath();
      this.fogCtx.moveTo(0, yPos);
      
      for (let x = 0; x < this.canvas.width; x += 50) {
        const y = yPos + Math.sin((x + this.waveOffset * (i + 1) * 0.3) * 0.01) * 20;
        this.fogCtx.lineTo(x, y);
      }
      
      this.fogCtx.lineTo(this.canvas.width, yPos);
      this.fogCtx.lineTo(this.canvas.width, yPos + height);
      this.fogCtx.lineTo(0, yPos + height);
      this.fogCtx.closePath();
      this.fogCtx.fill();
    }
    
    // 应用模糊
    this.fogCtx.filter = 'blur(20px)';
    this.fogCtx.globalAlpha = 0.7;
    this.fogCtx.drawImage(this.fogCanvas, 0, 0);
    this.fogCtx.filter = 'none';
    this.fogCtx.globalAlpha = 1.0;
    
    // 将雾效果应用到主画布
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.drawImage(this.fogCanvas, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    
    this.ctx.restore();
  }
  
  // 渲染天体 (太阳/月亮)
  renderCelestialBody() {
    const timeMinutes = this.timeOfDay;
    let celestialBodyPos = {
      x: this.canvas.width * 0.5,
      y: 0
    };
    
    // 根据时间计算位置 (简化版椭圆轨道)
    const dayProgress = timeMinutes / 1440; // 0-1 一天的进度
    const angle = (dayProgress * 2 * Math.PI) - Math.PI/2; // 转换为弧度，从天顶开始
    
    // 计算天体位置
    const radiusX = this.canvas.width * 0.6;
    const radiusY = this.canvas.height * 0.45;
    celestialBodyPos.x = this.canvas.width/2 + Math.cos(angle) * radiusX;
    celestialBodyPos.y = this.canvas.height * 0.35 + Math.sin(angle) * radiusY;
    
    // 确定是太阳还是月亮
    let isSunVisible = angle > -Math.PI && angle < 0;
    
    // 只有在天空上方时才渲染
    if (celestialBodyPos.y < this.canvas.height * 0.6) {
      this.ctx.save();
      
      // 计算天体亮度 (基于高度)
      const maxHeight = this.canvas.height * 0.1;
      const heightRatio = 1 - Math.min(1, Math.max(0, (celestialBodyPos.y - maxHeight) / (this.canvas.height * 0.5 - maxHeight)));
      const alpha = Math.min(0.9, heightRatio * 0.9);
      
      if (isSunVisible) {
        // 绘制太阳
        const gradient = this.ctx.createRadialGradient(
          celestialBodyPos.x, celestialBodyPos.y, 0,
          celestialBodyPos.x, celestialBodyPos.y, 40
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.7, `rgba(255, 200, 100, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(celestialBodyPos.x, celestialBodyPos.y, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制光晕
        if (this.currentWeather === 'clear' || this.currentWeather === 'cloudy') {
          const haloGradient = this.ctx.createRadialGradient(
            celestialBodyPos.x, celestialBodyPos.y, 30,
            celestialBodyPos.x, celestialBodyPos.y, 100
          );
          
          haloGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha * 0.4})`);
          haloGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
          
          this.ctx.fillStyle = haloGradient;
          this.ctx.beginPath();
          this.ctx.arc(celestialBodyPos.x, celestialBodyPos.y, 100, 0, Math.PI * 2);
          this.ctx.fill();
        }
      } else {
        // 绘制月亮
        const moonPhase = (this.timeOfDay % (30 * 1440)) / (30 * 1440); // 月相 (简化)
        const moonRadius = 30;
        
        // 基本月亮形状
        this.ctx.fillStyle = `rgba(230, 230, 230, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(celestialBodyPos.x, celestialBodyPos.y, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 月相效果
        const phaseOffset = (moonPhase * 2 - 1) * moonRadius * 2;
        this.ctx.fillStyle = `rgba(40, 40, 60, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(celestialBodyPos.x + phaseOffset, celestialBodyPos.y, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 月亮表面纹理 (陨石坑)
        this.ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.5})`;
        for (let i = 0; i < 5; i++) {
          const craterX = celestialBodyPos.x + (Math.random() - 0.5) * moonRadius;
          const craterY = celestialBodyPos.y + (Math.random() - 0.5) * moonRadius;
          const craterRadius = 2 + Math.random() * 4;
          
          this.ctx.beginPath();
          this.ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      
      this.ctx.restore();
    }
  }
  
  // 绘制闪电
  renderLightning() {
    // 闪电只在特定时机绘制 (由闪电函数控制)
    if (this.filters.brightness > 1.2) {
      this.ctx.save();
      
      const x = Math.random() * this.canvas.width;
      const gradientHeight = this.canvas.height * 0.4;
      
      const gradient = this.ctx.createLinearGradient(x, 0, x, gradientHeight);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(180, 180, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.fillRect(0, 0, this.canvas.width, gradientHeight);
      
      this.ctx.restore();
    }
  }
  
  // 清理资源
  cleanup() {
    // 停止所有音效
    for (const sound of Object.values(this.sounds)) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

// 导出模块
export default WeatherEffects; 