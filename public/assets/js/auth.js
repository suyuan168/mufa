/**
 * Authentication Module
 * Handles user registration and login with verification code
 */
const Auth = (() => {
  // DOM Elements - 账号密码登录
  const usernameInput = document.getElementById('username-input');
  const passwordInput = document.getElementById('password-input');
  const loginCodeInput = document.getElementById('login-code-input');
  const loginSendCodeBtn = document.getElementById('login-send-code-btn');
  const accountLoginBtn = document.getElementById('account-login-btn');
  
  // DOM Elements - 账号注册
  const registerUsernameInput = document.getElementById('register-username-input');
  const registerPasswordInput = document.getElementById('register-password-input');
  const nicknameInput = document.getElementById('nickname-input');
  const registerCodeInput = document.getElementById('register-code-input');
  const registerSendCodeBtn = document.getElementById('register-send-code-btn');
  const registerBtn = document.getElementById('register-btn');
  
  // DOM Elements - 登录选项切换
  const optionAccount = document.getElementById('option-account');
  const optionRegister = document.getElementById('option-register');
  const accountLogin = document.getElementById('account-login');
  const accountRegister = document.getElementById('account-register');
  const toggleRegister = document.getElementById('toggle-register');
  
  // 错误信息
  const loginMessage = document.getElementById('login-message');
  
  // 显示消息
  const showMessage = (message, isError = true) => {
    console.log(message);
    if (!loginMessage) return;
    
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
    loginMessage.style.color = isError ? '#ff5252' : '#4fc3f7';
    
    // 3秒后清除信息
    setTimeout(() => {
      loginMessage.textContent = '';
      loginMessage.style.display = 'none';
    }, 3000);
  };
  
  // 模拟登录成功 - 简化版本，永远成功
  const simulateSuccessfulLogin = (userData) => {
    // 保存用户数据到本地存储
    localStorage.setItem('token', 'demo_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(userData));
    
    // 显示成功消息
    showMessage('登录成功，正在进入游戏...', false);
    
    // 延迟切换到房间选择界面
    setTimeout(() => {
      try {
        console.log('切换到房间界面');
        UI.showScreen('room');
      } catch (e) {
        console.error('切换界面失败:', e);
        alert('登录成功！请刷新页面后重试。');
      }
    }, 1000);
    
    return { success: true };
  };
  
  // 发送验证码 - 永远成功
  const sendVerificationCode = async (username) => {
    showMessage('验证码已发送: 1234', false);
    return { success: true };
  };
  
  // 账号密码验证码登录 - 永远成功，简单验证
  const loginWithAccount = async (username, password, code) => {
    console.log(`尝试登录: 用户名=${username}, 密码长度=${password.length}, 验证码=${code}`);
    
    // 验证验证码 - 简化版本，固定验证码1234
    if (code !== '1234') {
      showMessage('验证码错误');
      throw new Error('验证码错误');
    }
    
    // 模拟用户数据
    const userData = {
      id: 1,
      username: username || 'default_user',
      nickname: '游戏玩家',
      level: 1
    };
    
    return simulateSuccessfulLogin(userData);
  };
  
  // 账号注册 - 永远成功，简单验证
  const registerAccount = async (username, password, nickname, code) => {
    console.log(`尝试注册: 用户名=${username}, 密码长度=${password.length}, 昵称=${nickname}, 验证码=${code}`);
    
    // 验证验证码 - 简化版本，固定验证码1234
    if (code !== '1234') {
      showMessage('验证码错误');
      throw new Error('验证码错误');
    }
    
    // 模拟用户数据
    const userData = {
      id: 1,
      username: username,
      nickname: nickname,
      level: 1
    };
    
    return simulateSuccessfulLogin(userData);
  };
  
  // 退出登录
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };
  
  // 检查是否已登录
  const isLoggedIn = () => {
    return !!localStorage.getItem('token');
  };
  
  // 获取当前用户
  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };
  
  // 获取token
  const getToken = () => {
    return localStorage.getItem('token');
  };
  
  // 初始化认证模块
  const init = () => {
    console.log('Auth模块初始化...');
    
    // 如果已登录，直接进入房间选择页面
    if (isLoggedIn()) {
      console.log('用户已登录，跳转到房间选择页面');
      try {
        UI.showScreen('room');
      } catch (e) {
        console.error('切换界面失败:', e);
      }
      return;
    }
    
    // 登录选项切换
    if (optionAccount && optionRegister && accountLogin && accountRegister) {
      optionAccount.addEventListener('click', () => {
        optionAccount.classList.add('active');
        optionRegister.classList.remove('active');
        accountLogin.style.display = 'block';
        accountRegister.style.display = 'none';
      });
      
      optionRegister.addEventListener('click', () => {
        optionRegister.classList.add('active');
        optionAccount.classList.remove('active');
        accountRegister.style.display = 'block';
        accountLogin.style.display = 'none';
      });
    }
    
    // 发送登录验证码
    if (loginSendCodeBtn && usernameInput) {
      loginSendCodeBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        
        if (!username) {
          showMessage('请先输入账号');
          return;
        }
        
        // 禁用按钮
        loginSendCodeBtn.disabled = true;
        loginSendCodeBtn.textContent = '发送中...';
        
        const result = await sendVerificationCode(username);
        
        // 倒计时
        let countdown = 5; // 缩短到5秒方便测试
        const timer = setInterval(() => {
          loginSendCodeBtn.textContent = `${countdown}秒`;
          countdown--;
          
          if (countdown < 0) {
            clearInterval(timer);
            loginSendCodeBtn.disabled = false;
            loginSendCodeBtn.textContent = '获取验证码';
          }
        }, 1000);
        
        showMessage('验证码: 1234', false);
      });
    }
    
    // 发送注册验证码
    if (registerSendCodeBtn && registerUsernameInput) {
      registerSendCodeBtn.addEventListener('click', async () => {
        const username = registerUsernameInput.value.trim();
        
        if (!username) {
          showMessage('请先输入账号');
          return;
        }
        
        // 禁用按钮
        registerSendCodeBtn.disabled = true;
        registerSendCodeBtn.textContent = '发送中...';
        
        const result = await sendVerificationCode(username);
        
        // 倒计时
        let countdown = 5; // 缩短到5秒方便测试
        const timer = setInterval(() => {
          registerSendCodeBtn.textContent = `${countdown}秒`;
          countdown--;
          
          if (countdown < 0) {
            clearInterval(timer);
            registerSendCodeBtn.disabled = false;
            registerSendCodeBtn.textContent = '获取验证码';
          }
        }, 1000);
        
        showMessage('验证码: 1234', false);
      });
    }
    
    // 账号密码验证码登录
    if (accountLoginBtn && usernameInput && passwordInput && loginCodeInput) {
      accountLoginBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const code = loginCodeInput.value.trim();
        
        if (!username || !password || !code) {
          showMessage('请填写完整的账号、密码和验证码');
          return;
        }
        
        // 禁用按钮
        accountLoginBtn.disabled = true;
        accountLoginBtn.textContent = '登录中...';
        
        try {
          await loginWithAccount(username, password, code);
        } catch (error) {
          console.error('登录出错:', error);
          showMessage('登录出错，请重试');
          accountLoginBtn.disabled = false;
          accountLoginBtn.textContent = '登录游戏';
        }
      });
    }
    
    // 账号注册
    if (registerBtn && registerUsernameInput && registerPasswordInput && nicknameInput && registerCodeInput) {
      registerBtn.addEventListener('click', async () => {
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value;
        const nickname = nicknameInput.value.trim();
        const code = registerCodeInput.value.trim();
        
        if (!username || !password || !nickname || !code) {
          showMessage('请填写完整的注册信息');
          return;
        }
        
        // 禁用按钮
        registerBtn.disabled = true;
        registerBtn.textContent = '注册中...';
        
        try {
          await registerAccount(username, password, nickname, code);
        } catch (error) {
          console.error('注册失败:', error);
          showMessage('注册失败，请稍后再试');
          registerBtn.disabled = false;
          registerBtn.textContent = '注册账号';
        }
      });
    }
    
    // 切换到注册模式
    if (toggleRegister) {
      toggleRegister.addEventListener('click', () => {
        optionRegister.click();
        showMessage('请填写注册信息，验证码为1234', false);
      });
    }
    
    console.log('Auth模块初始化完成');
  };
  
  // 导出公共方法
  return {
    init,
    isLoggedIn,
    getCurrentUser,
    getToken,
    logout,
    showMessage
  };
})();}