/**
 * 游戏房间管理器
 * 负责创建、管理和销毁游戏房间
 */
const GameRoom = require('./GameRoom');
const { v4: uuidv4 } = require('uuid');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.playerRooms = new Map(); // 记录玩家所在的房间
    this.cleanupInterval = null;
    
    // 启动定期清理
    this.startCleanupInterval();
  }

  // 创建新房间
  createRoom() {
    const roomId = uuidv4();
    const room = new GameRoom(roomId, this.io);
    this.rooms.set(roomId, room);
    
    console.log(`创建新房间: ${roomId}, 当前房间数: ${this.rooms.size}`);
    return room;
  }

  // 加入房间
  joinRoom(socketId, playerData, roomId = null) {
    // 如果指定了房间ID，尝试加入该房间
    if (roomId && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const success = room.addPlayer(socketId, playerData);
      
      if (success) {
        this.playerRooms.set(socketId, roomId);
        this.io.to(socketId).emit('room:joined', { roomId, players: room.getActivePlayers().length });
        return room;
      }
    }
    
    // 寻找有空位的房间，或创建新房间
    let targetRoom = null;
    
    // 查找可加入的房间
    for (const [id, room] of this.rooms.entries()) {
      if (room.state.active && room.players.size < room.maxPlayersAllowed) {
        targetRoom = room;
        break;
      }
    }
    
    // 如果没有可用房间，创建一个新房间
    if (!targetRoom) {
      targetRoom = this.createRoom();
    }
    
    // 加入房间
    const success = targetRoom.addPlayer(socketId, playerData);
    
    if (success) {
      this.playerRooms.set(socketId, targetRoom.id);
      this.io.to(socketId).emit('room:joined', { 
        roomId: targetRoom.id, 
        players: targetRoom.getActivePlayers().length 
      });
      return targetRoom;
    }
    
    return null;
  }

  // 玩家离开房间
  leaveRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId || !this.rooms.has(roomId)) return false;
    
    const room = this.rooms.get(roomId);
    const success = room.removePlayer(socketId);
    
    if (success) {
      this.playerRooms.delete(socketId);
      
      // 如果房间空了且超过30分钟，考虑销毁房间
      if (room.players.size === 0) {
        this.checkAndRemoveEmptyRoom(roomId);
      }
      
      return true;
    }
    
    return false;
  }

  // 获取玩家所在房间
  getPlayerRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId || !this.rooms.has(roomId)) return null;
    
    return this.rooms.get(roomId);
  }

  // 获取房间
  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  // 获取所有房间状态
  getAllRooms() {
    const roomsData = [];
    
    for (const [id, room] of this.rooms.entries()) {
      roomsData.push(room.getRoomState());
    }
    
    return roomsData;
  }

  // 检查并移除空房间
  checkAndRemoveEmptyRoom(roomId, force = false) {
    if (!this.rooms.has(roomId)) return false;
    
    const room = this.rooms.get(roomId);
    
    // 如果房间不为空且不是强制删除，不操作
    if (room.players.size > 0 && !force) return false;
    
    // 如果房间空了且(强制删除或超过30分钟)，销毁房间
    const now = Date.now();
    const roomEmptyTime = room.players.size === 0 ? (now - room.state.lastActivity || 0) : 0;
    
    if (force || roomEmptyTime > 30 * 60 * 1000) { // 30分钟
      room.stopGameLoop();
      this.rooms.delete(roomId);
      console.log(`销毁房间: ${roomId}, 当前房间数: ${this.rooms.size}`);
      return true;
    }
    
    return false;
  }

  // 启动定期清理空房间
  startCleanupInterval() {
    // 每10分钟检查一次
    this.cleanupInterval = setInterval(() => {
      console.log(`开始定期清理房间, 当前房间数: ${this.rooms.size}`);
      
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.players.size === 0) {
          this.checkAndRemoveEmptyRoom(roomId);
        }
      }
    }, 10 * 60 * 1000);
  }

  // 停止定期清理
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

module.exports = RoomManager; 