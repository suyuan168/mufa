-- 修复数据库脚本
-- 这个脚本解决所有数据库问题，包括"Unknown column 'username' in 'field list'"和外键约束错误

-- 0. 临时禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 备份任何可能的现有数据（可选）
-- CREATE TABLE users_backup LIKE users;
-- INSERT INTO users_backup SELECT * FROM users;

-- 2. 删除现有表
DROP TABLE IF EXISTS users;

-- 3. 使用正确的字段创建新表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  game_progress JSON DEFAULT '{"level": 1, "resources": {"wood": 0, "plastic": 0, "metal": 0, "food": 10, "water": 10}, "raftSize": 1, "items": [], "lastSaved": null}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. 插入测试用户
INSERT INTO users (phone_number, username, nickname, password, level)
VALUES 
('13800000000', 'test', '测试用户', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 1),
('13900000000', 'admin', '管理员', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 1);

-- 5. 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 6. 验证表是否创建成功
SELECT * FROM users;

-- 7. 可能的问题排查
-- 如果你仍然遇到外键约束问题，可能是其他表引用了users表
-- 你可以使用以下查询找出那些表:
-- 
-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_NAME = 'users';
--
-- 然后处理这些表的外键约束 