-- 格式化后的INSERT语句

-- 插入或更新测试用户
INSERT INTO users (phone_number, nickname, password, username, level)
VALUES 
('13800000000', '测试用户', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 'test', 1)
ON DUPLICATE KEY UPDATE 
  nickname = '测试用户',
  username = 'test';

-- 如果执行此语句时报错"Unknown column 'level' in 'field list'"，请尝试以下语句：
-- INSERT INTO users (phone_number, nickname, password, username)
-- VALUES 
-- ('13800000000', '测试用户', '$2b$10$6Bnl2XByKQaEvRQo9fUYRexzvkVjsJ4HMxKrMJH5zMvRpssrIJovy', 'test')
-- ON DUPLICATE KEY UPDATE 
--   nickname = '测试用户',
--   username = 'test';

-- 如果执行此语句时报错"Unknown column 'username' in 'field list'"，请确认先执行以下语句：
-- ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;

-- 验证用户是否已成功添加
-- SELECT * FROM users WHERE phone_number = '13800000000'; 