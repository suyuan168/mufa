-- 修复外键约束的SQL脚本

-- 1. 临时禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 删除users表
DROP TABLE IF EXISTS users;

-- 3. 创建新的users表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  level INT DEFAULT 1,
  game_progress JSON DEFAULT '{"level": 1, "resources": {"wood": 0, "plastic": 0, "metal": 0, "food": 10, "water": 10}, "raftSize": 1, "items": [], "lastSaved": null}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. 插入测试用户
INSERT INTO users (phone_number, nickname, password, level)
VALUES ('13800000000', '测试用户', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 1);

-- 5. 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 如果不想禁用外键检查，可以按照以下顺序操作：

-- 1. 先检查并记录game_rooms表中的数据
-- SELECT * FROM game_rooms;

-- 2. 删除引用users表的所有表
-- DROP TABLE IF EXISTS game_rooms;
-- DROP TABLE IF EXISTS game_saves; -- 如果也引用了users表

-- 3. 删除users表
-- DROP TABLE IF EXISTS users;

-- 4. 重新创建users表
-- CREATE TABLE users...

-- 5. 重新创建引用表
-- CREATE TABLE game_rooms...
-- CREATE TABLE game_saves...

-- 6. 恢复之前备份的数据
-- INSERT INTO game_rooms...

-- 或者，直接修复用户表而不删除：

-- 1. 查看表结构
-- DESCRIBE users;

-- 2. 修改表，添加缺失字段
-- ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- 3. 更新现有记录
-- UPDATE users SET username = 'test' WHERE phone_number = '13800000000'; 