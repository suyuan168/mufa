const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

// 创建User模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: /^\d{11}$/
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gameProgress: {
    type: DataTypes.JSON,
    defaultValue: {
      level: 1,
      resources: {
        wood: 0,
        plastic: 0,
        metal: 0,
        food: 10,
        water: 10
      },
      raftSize: 1,
      items: [],
      lastSaved: new Date()
    }
  }
}, {
  tableName: 'users',
  hooks: {
    // 密码加密钩子
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 添加实例方法
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 同步模型到数据库
const syncUserModel = async () => {
  await User.sync({ alter: true });
  console.log("User模型已同步到数据库");
};

module.exports = { User, syncUserModel }; 