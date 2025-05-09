# 木筏生存网页游戏

## 项目介绍

木筏生存是一款基于《木筏生存》(Raft) 游戏概念的多人联机H5沙盒生存游戏。玩家在无边际的海洋中生存，使用钩子收集漂浮的资源，扩展木筏，制作物品，并与其他玩家一起探索海洋世界。游戏强调生存、资源管理和合作玩法，为玩家提供沉浸式的海上生存体验。

## 游戏特点

- **多人联机**：实时多人游戏体验，支持好友组队和陌生人匹配
- **沙盒建造**：自由扩展和定制你的木筏，打造独一无二的海上家园
- **资源收集**：使用钩子收集海上漂浮的各种资源
- **生存挑战**：管理饥饿、口渴和健康状态，抵御鲨鱼等危险
- **物品制作**：利用收集的资源制作各种工具、武器和生存装备
- **探索发现**：探索神秘岛屿，发现稀有资源和隐藏宝藏
- **移动优化**：针对手机触屏优化的游戏控制
- **自动保存**：游戏进度自动保存，随时可以继续冒险

## 技术栈

### 前端技术

- **界面**：HTML5、CSS3、响应式设计
- **游戏引擎**：原生 JavaScript、HTML5 Canvas
- **网络通信**：Socket.io 客户端
- **本地存储**：LocalStorage

### 后端技术

- **服务器**：Node.js、Express
- **实时通信**：Socket.io
- **数据库**：MySQL
- **认证**：JWT (JSON Web Token)
- **进程管理**：PM2

## 游戏玩法

### 基础操作

1. 使用账号密码注册并登录游戏（测试版固定验证码：1234）
2. 使用左侧虚拟摇杆控制木筏移动方向
3. 点击右侧「钩子」按钮向指定方向发射钩子收集漂浮的资源
4. 通过底部菜单访问物品栏、制作菜单和木筏建造界面
5. 与其他在线玩家互动，组队合作生存

### 生存系统

游戏中玩家需要管理以下生存需求：

- **饥饿值**：需要定期寻找或制作食物维持
- **口渴值**：需要收集雨水或使用净水器获取淡水
- **健康值**：受到攻击或环境影响会降低，可通过食物和医疗物品恢复
- **体温**：受天气影响，过冷或过热都会影响健康
- **能量值**：影响行动速度和效率，需要休息恢复

## 资源类型

游戏中包含多种资源类型：

- **基础资源**：木材、塑料、金属、绳索、布料等
- **生存资源**：食物、淡水、医疗包等
- **高级资源**：电池、工具零件、科技组件等
- **稀有资源**：稀有种子、蓝图、特殊材料等

## 木筏建造

玩家可以建造和升级多种木筏组件：

- **基础平台**：木筏的基础，提供站立和建造空间
- **围墙**：保护木筏免受海浪和敌人侵袭
- **帆**：利用风力推动木筏移动
- **储物箱**：增加资源存储空间
- **净水器**：将海水转化为饮用水
- **烤炉**：用于烹饪食物
- **锚**：固定木筏位置
- **雷达**：探测远处的岛屿和资源
- **防御网**：减少鲨鱼攻击的伤害
- **引擎**：提供稳定的动力来源

## 安装与部署

### 环境要求

- Node.js 14+
- MySQL 5.7+
- Nginx (用于反向代理，可选)
- PM2 (用于进程管理，可选)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/mufa.git
cd mufa
```

#### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

#### 3. 数据库配置

```sql
# 创建数据库和用户
CREATE DATABASE mufa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mufa'@'localhost' IDENTIFIED BY 'mufa123456';
GRANT ALL PRIVILEGES ON mufa.* TO 'mufa'@'localhost';
FLUSH PRIVILEGES;
```

使用提供的数据库修复脚本创建所需表：

```bash
mysql -u mufa -p mufa < fix-database.sql
```

#### 4. 环境配置

在项目根目录创建 `.env` 文件：

```
DB_HOST=localhost
DB_USER=mufa
DB_PASSWORD=mufa123456
DB_NAME=mufa
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

#### 5. 启动服务

开发模式：

```bash
# 启动后端服务
cd server
npm run dev

# 在另一个终端启动前端服务
cd public
python -m http.server 8080
```

生产模式（使用PM2）：

```bash
npm install pm2 -g
pm2 start ecosystem.config.js
```

#### 6. 访问游戏

开发模式下，访问 `http://localhost:8080`

## 移动端使用说明

1. 确保手机与电脑在同一网络下
2. 在手机浏览器中访问电脑的IP地址和端口，例如：`http://192.168.1.100:8080`
3. 为获得最佳体验，建议使用 Chrome 或 Safari 浏览器
4. 游戏支持横屏和竖屏模式，但横屏体验更佳

## 游戏天气系统

游戏中的天气会影响玩家的生存状态和资源生成：

- **晴朗**：基础生存状态，资源生成正常
- **多云**：轻微降低体温，能量消耗正常
- **雾天**：降低体温，增加能量消耗，视野受限
- **风暴**：显著降低体温，大幅增加能量消耗，资源漂流速度加快
- **暴风雨**：严重降低体温，极大增加能量消耗，可能出现特殊资源

## 多人联机功能

- **房间系统**：创建或加入游戏房间
- **实时互动**：与其他玩家实时交流和互动
- **资源共享**：团队成员可以共享资源和物品
- **协作建造**：多人共同扩展和升级木筏
- **角色分工**：可以分配不同角色（建造者、收集者、防御者等）

## 未来扩展

1. **工具和武器系统** - 允许玩家制作更多种类的工具和武器
2. **种植系统** - 在木筏上种植作物
3. **深海探索** - 潜水获取海底资源
4. **任务系统** - 更复杂的任务和成就
5. **木筏装饰** - 个性化木筏外观
6. **天气系统增强** - 更多种类的天气和相应影响
7. **NPC交易系统** - 与NPC进行物品交易

## 开发者信息

本游戏是《木筏生存》(Raft) 的网页版致敬作品，仅用于学习和娱乐目的。原版《木筏生存》游戏由 Redbeet Interactive 开发，Axolot Games 发行。

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT License](LICENSE)