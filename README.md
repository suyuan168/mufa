# 木筏生存网页游戏

一款基于《木筏生存》(Raft) 游戏概念的手机网页游戏。玩家在无边际的海洋中生存，使用钩子收集资源，扩展木筏，并与其他玩家一起探索海洋世界。

## 游戏特点

- 使用手机号码注册和登录系统
- 手机触屏优化的游戏控制
- 资源收集与物品制作系统
- 实时多人游戏体验
- 游戏进度自动保存
- 排行榜系统

## 技术栈

- **前端**：原生 JavaScript、HTML5 Canvas、Socket.io 客户端
- **后端**：Node.js、Express、Socket.io、MongoDB
- **认证**：JWT (JSON Web Token)

## 游戏玩法

1. 玩家使用手机号码注册并登录游戏
2. 使用左侧虚拟摇杆控制木筏移动
3. 按下"钩子"按钮向指定方向发射钩子收集漂浮的资源
4. 收集到的资源可以用来制作各种物品和扩展木筏
5. 与其他在线玩家互动

## 资源类型

- **木头**：用于建造和扩展木筏
- **塑料**：用于制作工具和容器
- **金属**：用于制作高级工具和武器
- **食物**：用于维持生命
- **水**：用于维持生命

## 可制作物品

- **木筏扩展**：增加木筏的大小
- **钓鱼竿**：用于捕捉鱼类
- **净水器**：将海水转化为饮用水
- **鱼叉**：用于防御和捕捉鱼类

## 安装与运行

### 前提条件

- Node.js 14+
- MySQL 5.7+

### 安装步骤

1. 克隆仓库
```
git clone https://github.com/yourusername/raft-web-game.git
cd raft-web-game
```

2. 安装依赖
```
npm install
```

3. 创建并配置环境变量
创建一个 `.env` 文件，包含以下内容：
```
PORT=3000
DB_NAME=raft_game
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
```

4. 创建MySQL数据库
```
mysql -u root -p
CREATE DATABASE raft_game;
exit;
```

5. 启动服务器
```
npm start
```

6. 访问游戏
打开浏览器访问 `http://localhost:3000`

## 移动端使用说明

1. 确保手机与电脑在同一网络下
2. 在手机浏览器中访问电脑的IP地址和端口，例如：`http://192.168.1.100:3000`
3. 为获得最佳体验，建议使用 Chrome 或 Safari 浏览器

## 开发者信息

本游戏是《木筏生存》(Raft) 的网页版致敬作品，仅用于学习和娱乐目的。原版《木筏生存》游戏由 Redbeet Interactive 开发，Axolot Games 发行。

## 许可证

[MIT License](LICENSE) 