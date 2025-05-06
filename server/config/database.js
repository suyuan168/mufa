const { Sequelize } = require('sequelize');

// 创建Sequelize实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'raft_game',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      // 为了支持中文和表情符号
      charset: 'utf8mb4'
    },
    define: {
      // 统一默认为timestamp字段名
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL连接成功。');
  } catch (error) {
    console.error('无法连接到MySQL数据库:', error);
  }
};

module.exports = { sequelize, testConnection }; 