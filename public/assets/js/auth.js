/**
 * Authentication Module
 * Handles user registration and login
 */
const Auth = (() => {
  // DOM Elements - 账号密码登录
  const usernameInput = document.getElementById('username-input');
  const passwordInput = document.getElementById('password-input');
  const accountLoginBtn = document.getElementById('account-login-btn');
  
  // DOM Elements - 手机验证码登录
  const phoneInput = document.getElementById('phone-input');
  const codeInput = document.getElementById('code-input');
  const sendCodeBtn = document.getElementById('send-code-btn');
  const loginBtn = document.getElementById('login-btn');
  
  // DOM Elements - 登录选项切换
  const optionAccount = document.getElementById('option-account');
  const optionPhone = document.getElementById('option-phone');
  const accountLogin = document.getElementById('account-login');
  const phoneLogin = document.getElementById('phone-login');
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
  const sendVerificationCode = async (phone) => {
    showMessage('验证码已发送: 1234', false);
    return { success: true };
  };
  
  // 账号密码登录 - 永远成功，无验证
  const loginWithAccount = async (username, password) => {
    console.log(`尝试登录: 用户名=${username}, 密码长度=${password.length}`);
    
    // 模拟用户数据
    const userData = {
      id: 1,
      username: username || 'default_user',
      nickname: '游戏玩家',
      level: 1
    };
    
    return simulateSuccessfulLogin(userData);
  };
  
  // 手机验证码登录 - 永远成功，无验证
  const loginWithPhone = async (phone, code) => {
    console.log(`尝试手机登录: 手机=${phone}, 验证码=${code}`);
    
    // 模拟用户数据
    const userData = {
      id: 1,
      phone: phone || '13800000000',
      nickname: '手机用户',
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
    if (optionAccount && optionPhone && accountLogin && phoneLogin) {
      optionAccount.addEventListener('click', () => {
        optionAccount.classList.add('active');
        optionPhone.classList.remove('active');
        accountLogin.style.display = 'block';
        phoneLogin.style.display = 'none';
      });
      
      optionPhone.addEventListener('click', () => {
        optionPhone.classList.add('active');
        optionAccount.classList.remove('active');
        phoneLogin.style.display = 'block';
        accountLogin.style.display = 'none';
      });
    }
    
    // 发送验证码
    if (sendCodeBtn && phoneInput) {
      sendCodeBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        
        // 简化版本：任何手机号都接受
        // 禁用按钮
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = '发送中...';
        
        const result = await sendVerificationCode(phone);
        
        // 倒计时
        let countdown = 5; // 缩短到5秒方便测试
        const timer = setInterval(() => {
          sendCodeBtn.textContent = `${countdown}秒`;
          countdown--;
          
          if (countdown < 0) {
            clearInterval(timer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
          }
        }, 1000);
        
        showMessage('验证码: 1234', false);
      });
    }
    
    // 账号密码登录
    if (accountLoginBtn && usernameInput && passwordInput) {
      accountLoginBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim() || 'guest';
        const password = passwordInput.value || '123456';
        
        // 简化版本：任何用户名密码都接受
        
        // 禁用按钮
        accountLoginBtn.disabled = true;
        accountLoginBtn.textContent = '登录中...';
        
        try {
          await loginWithAccount(username, password);
        } catch (error) {
          console.error('登录出错:', error);
          showMessage('登录出错，请重试');
          accountLoginBtn.disabled = false;
          accountLoginBtn.textContent = '登录游戏';
        }
      });
    }
    
    // 手机验证码登录
    if (loginBtn && phoneInput && codeInput) {
      loginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim() || '13800000000';
        const code = codeInput.value.trim() || '1234';
        
        // 简化版本：任何手机号和验证码都接受
        
        // 禁用按钮
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';
        
        try {
          await loginWithPhone(phone, code);
        } catch (error) {
          console.error('登录出错:', error);
          showMessage('登录出错，请重试');
          loginBtn.disabled = false;
          loginBtn.textContent = '登录游戏';
        }
      });
    }
    
    // 切换到注册模式
    if (toggleRegister) {
      toggleRegister.addEventListener('click', () => {
        showMessage('提示：输入任意账号密码即可登录，或使用任意手机号和验证码1234登录', false);
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
})(); 