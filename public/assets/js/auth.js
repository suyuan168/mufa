/**
 * Authentication Module
 * Handles user registration and login
 */
const Auth = (() => {
  // API endpoint
  const API_URL = '/api/auth';
  
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
  
  // 验证手机号
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };
  
  // 显示错误信息
  const showMessage = (message, isError = true) => {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
    loginMessage.style.color = isError ? '#ff5252' : '#4fc3f7';
    
    // 3秒后清除信息
    setTimeout(() => {
      loginMessage.textContent = '';
      loginMessage.style.display = 'none';
    }, 3000);
  };
  
  // 发送验证码
  const sendVerificationCode = async (phone) => {
    try {
      const response = await fetch(`${API_URL}/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: phone })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '验证码发送失败');
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  };
  
  // 账号密码登录
  const loginWithAccount = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }
      
      // 保存token和用户数据
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  };
  
  // 手机验证码登录
  const loginWithPhone = async (phone, code) => {
    try {
      const response = await fetch(`${API_URL}/login-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phone,
          verificationCode: code
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }
      
      // 保存token和用户数据
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  };
  
  // 注册新用户
  const register = async (phone, nickname, password) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phone,
          nickname,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }
      
      // 保存token和用户数据
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
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
    // 如果已登录，直接进入房间选择页面
    if (isLoggedIn()) {
      UI.showScreen('room');
      return;
    }
    
    // 登录选项切换
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
    
    // 发送验证码
    sendCodeBtn.addEventListener('click', async () => {
      const phone = phoneInput.value.trim();
      
      if (!phone) {
        showMessage('请输入手机号');
        return;
      }
      
      if (!validatePhoneNumber(phone)) {
        showMessage('请输入有效的11位手机号');
        return;
      }
      
      // 禁用按钮，防止重复发送
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = '发送中...';
      
      const result = await sendVerificationCode(phone);
      
      if (result.success) {
        // 倒计时60秒
        let countdown = 60;
        const timer = setInterval(() => {
          sendCodeBtn.textContent = `${countdown}秒`;
          countdown--;
          
          if (countdown < 0) {
            clearInterval(timer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '获取验证码';
          }
        }, 1000);
        
        showMessage('验证码已发送，请查收', false);
      } else {
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = '获取验证码';
        showMessage(result.message);
      }
    });
    
    // 账号密码登录
    accountLoginBtn.addEventListener('click', async () => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !password) {
        showMessage('账号和密码都是必填项');
        return;
      }
      
      // 禁用按钮防止重复提交
      accountLoginBtn.disabled = true;
      accountLoginBtn.textContent = '登录中...';
      
      const result = await loginWithAccount(username, password);
      
      // 恢复按钮
      accountLoginBtn.disabled = false;
      accountLoginBtn.textContent = '登录游戏';
      
      if (result.success) {
        // 切换到房间选择界面
        UI.showScreen('room');
      } else {
        showMessage(result.message);
      }
    });
    
    // 手机验证码登录
    loginBtn.addEventListener('click', async () => {
      const phone = phoneInput.value.trim();
      const code = codeInput.value.trim();
      
      if (!phone || !code) {
        showMessage('手机号和验证码都是必填项');
        return;
      }
      
      if (!validatePhoneNumber(phone)) {
        showMessage('请输入有效的11位手机号');
        return;
      }
      
      // 禁用按钮防止重复提交
      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';
      
      const result = await loginWithPhone(phone, code);
      
      // 恢复按钮
      loginBtn.disabled = false;
      loginBtn.textContent = '登录游戏';
      
      if (result.success) {
        // 切换到房间选择界面
        UI.showScreen('room');
      } else {
        showMessage(result.message);
      }
    });
    
    // 切换到注册模式
    toggleRegister.addEventListener('click', () => {
      // TODO: 实现注册界面或弹窗
      alert('注册功能即将推出，请先使用测试账号登录：\n账号：test\n密码：123456');
    });
  };
  
  // 导出公共方法
  return {
    init,
    isLoggedIn,
    getCurrentUser,
    getToken,
    logout
  };
})(); 