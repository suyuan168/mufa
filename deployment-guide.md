# 木筏生存 (Raft Survival) 部署指南

这个指南将帮助你部署和运行木筏生存游戏。

## 1. 环境要求

- Node.js 14+
- MySQL 5.7+
- Nginx (用于反向代理)
- PM2 (用于进程管理)

## 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

在服务器目录执行：

```bash
cd server
npm install
```

## 3. 数据库配置

### 3.1 创建数据库

```sql
CREATE DATABASE mufa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mufa'@'localhost' IDENTIFIED BY 'mufa123456';
GRANT ALL PRIVILEGES ON mufa.* TO 'mufa'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 创建表

使用提供的数据库修复脚本创建所需表：

```bash
mysql -u mufa -p mufa < fix-database.sql
```

## 4. 环境配置

在项目根目录创建 `.env` 文件：

```
# Server settings
PORT=3000
NODE_ENV=production

# Database configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mufa
DB_USER=mufa
DB_PASSWORD=mufa123456

# JWT secret for authentication
JWT_SECRET=wood-raft-super-secret-token-mufa

# Game settings
MAX_PLAYERS_PER_ROOM=4
RESOURCE_SPAWN_RATE=60
SHARK_SPAWN_RATE=300
```

## 5. 使用 PM2 部署

### 5.1 安装 PM2

```bash
npm install -g pm2
```

### 5.2 创建 PM2 配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: "mufa",
    script: "server/index.js",
    env: {
      NODE_ENV: "production",
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
```

### 5.3 启动应用

```bash
pm2 start ecosystem.config.js
```

### 5.4 设置开机自启

```bash
pm2 startup
pm2 save
```

## 6. Nginx 配置

创建 Nginx 配置文件：

```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

保存到 `/etc/nginx/sites-available/mufa` 然后启用：

```bash
ln -s /etc/nginx/sites-available/mufa /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 7. 常见问题排查

### 7.1 502 Bad Gateway 错误

检查应用是否正在运行：

```bash
pm2 status
pm2 logs mufa
```

确保端口没有被占用：

```bash
lsof -i :3000
```

### 7.2 数据库连接错误

检查 MySQL 服务状态：

```bash
systemctl status mysql
```

验证数据库凭据：

```bash
mysql -u mufa -p -e "SHOW DATABASES;"
```

### 7.3 登录问题

目前登录系统已经简化为接受任何账号和密码。

默认测试账号：
- 用户名：test
- 密码：任意

## 8. 重启应用

如有配置更改，使用以下命令重启应用：

```bash
pm2 restart mufa
```

## 9. 查看日志

```bash
pm2 logs mufa
```

遇到问题请查看日志，大部分错误信息会记录在日志中。 