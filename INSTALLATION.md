# 木筏生存游戏安装指南

本文档提供了木筏生存网页游戏的详细安装和部署步骤，适用于开发环境和生产环境。

## 目录

- [环境要求](#环境要求)
- [开发环境安装](#开发环境安装)
- [生产环境部署](#生产环境部署)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)

## 环境要求

### 基础环境

- **操作系统**：支持 Windows、macOS 或 Linux
- **Node.js**：14.0.0 或更高版本
- **MySQL**：5.7 或更高版本
- **浏览器**：Chrome、Firefox、Safari 最新版本

### 可选组件

- **Nginx**：用于反向代理和负载均衡
- **PM2**：用于Node.js应用程序进程管理
- **Redis**：用于会话存储和缓存（未来扩展）

## 开发环境安装

### 1. 克隆代码库

```bash
git clone https://github.com/yourusername/mufa.git
cd mufa
```

### 2. 安装依赖

安装前端依赖：

```bash
npm install
```

安装后端依赖：

```bash
cd server
npm install
cd ..
```

### 3. 配置数据库

#### 创建数据库和用户

```sql
CREATE DATABASE mufa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mufa'@'localhost' IDENTIFIED BY 'mufa123456';
GRANT ALL PRIVILEGES ON mufa.* TO 'mufa'@'localhost';
FLUSH PRIVILEGES;
```

#### 导入数据库结构

```bash
mysql -u mufa -p mufa < fix-database.sql
```

### 4. 环境配置

在项目根目录创建 `.env` 文件：

```
DB_HOST=localhost
DB_USER=mufa
DB_PASSWORD=mufa123456
DB_NAME=mufa
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 5. 启动开发服务器

启动后端服务：

```bash
cd server
npm run dev
```

在另一个终端窗口启动前端服务：

```bash
cd public
python -m http.server 8080
```

### 6. 访问应用

打开浏览器访问：`http://localhost:8080`

## 生产环境部署

### 1. 服务器准备

确保服务器已安装 Node.js、MySQL、Git 和 PM2：

```bash
# 安装 Node.js 和 npm (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm

# 安装 MySQL
sudo apt install mysql-server

# 安装 PM2
sudo npm install pm2 -g
```

### 2. 克隆和配置项目

```bash
git clone https://github.com/yourusername/mufa.git
cd mufa
npm install
cd server
npm install
cd ..
```

### 3. 配置数据库

按照开发环境中的步骤创建数据库和用户，并导入数据库结构。

### 4. 环境配置

创建生产环境的 `.env` 文件，确保使用安全的密码和密钥：

```
DB_HOST=localhost
DB_USER=mufa
DB_PASSWORD=strong_password_here
DB_NAME=mufa
JWT_SECRET=secure_random_string_here
PORT=3000
NODE_ENV=production
```

### 5. 使用 PM2 启动应用

```bash
pm2 start ecosystem.config.js
```

### 6. 配置 Nginx 反向代理

创建 Nginx 配置文件：

```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        root /path/to/mufa/public;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. 启用 HTTPS (推荐)

使用 Let's Encrypt 获取免费的 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. 设置自动启动

```bash
pm2 startup
pm2 save
```

## 数据库配置

### 数据库结构

木筏生存游戏使用以下主要数据表：

- **users**：存储用户账号信息
- **player_data**：存储玩家游戏进度和状态
- **game_rooms**：存储游戏房间信息
- **resources**：存储资源配置
- **raft_components**：存储木筏组件配置

### 数据库维护

定期备份数据库：

```bash
mysqldump -u mufa -p mufa > mufa_backup_$(date +%Y%m%d).sql
```

## 常见问题

### 1. 无法连接数据库

- 检查数据库服务是否运行
- 验证数据库用户名和密码是否正确
- 确认数据库用户有适当的权限

### 2. 游戏无法加载

- 检查浏览器控制台是否有错误信息
- 确认前端和后端服务都在运行
- 验证网络连接是否正常

### 3. Socket.io 连接问题

- 确保 Nginx 配置正确转发 WebSocket 连接
- 检查防火墙设置是否允许 WebSocket 连接
- 验证客户端和服务器的 Socket.io 版本是否兼容

### 4. PM2 相关问题

- 使用 `pm2 logs` 查看应用日志
- 使用 `pm2 monit` 监控应用状态
- 如需重启应用，使用 `pm2 restart ecosystem.config.js`

## 更多帮助

如果您在安装过程中遇到任何问题，请查阅以下资源：

- [项目 Wiki](https://github.com/yourusername/mufa/wiki)
- [提交 Issue](https://github.com/yourusername/mufa/issues)
- [联系开发团队](mailto:your.email@example.com)