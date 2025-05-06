-- 不删除表的修复方案
-- 更简单、更安全的方法是直接修改现有表

-- 1. 查看当前表结构
DESCRIBE users;

-- 2. 检查users表是否存在记录
SELECT COUNT(*) FROM users;

-- 3. 尝试方案一：增加username字段
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- 4. 为测试用户更新username
UPDATE users SET username = 'test' WHERE phone_number = '13800000000';

-- 5. 如果表中没有用户，添加测试用户
-- 注意：这条SQL假设表中已有username字段，如果没有，去掉username相关部分
INSERT INTO users (phone_number, nickname, password, username, level)
VALUES ('13800000000', '测试用户', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 'test', 1)
ON DUPLICATE KEY UPDATE 
  nickname = '测试用户',
  username = 'test';

-- 6. 验证测试用户是否存在
SELECT id, phone_number, nickname, username FROM users WHERE phone_number = '13800000000';

-- 如果以上方案不适用，尝试找出缺少的字段并添加
-- 例如，如果需要添加game_progress字段：
-- ALTER TABLE users ADD COLUMN game_progress JSON DEFAULT '{"level": 1, "resources": {"wood": 0, "plastic": 0, "metal": 0, "food": 10, "water": 10}, "raftSize": 1, "items": [], "lastSaved": null}';

-- 如果level字段不存在：
-- ALTER TABLE users ADD COLUMN level INT DEFAULT 1; 