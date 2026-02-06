// Single clean server implementation with reconnection support
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

const rooms = new Map();
const disconnectionTimers = new Map();

class GameRoom {
  constructor(name, password) {
    this.name = name;
    this.password = password || '';
    this.players = {};
    this.gameState = {
      turn: 1,
      turnCounter: 1,
      phase: 'main',
      deckReady: { player1: false, player2: false },
      gameStarted: false,
      playerCount: 0
    };
    this.imageAudioPaths = {};
  }

  addPlayer(socketId, index, connected = true) {
    this.players[socketId] = {
      playerIndex: index, // ✅ NEVER changes
      socketId,
      deckReady: false,
      deck: [],
       imagePath: '',
      audioPath: '',
      connected: connected
    };
    this.gameState.playerCount++;
  }

  removePlayer(socketId) {
    if (this.players[socketId]) {
      delete this.players[socketId];
      this.gameState.playerCount--;
    }
  }

  markDisconnected(socketId) {
    if (this.players[socketId]) {
      this.players[socketId].connected = false;
    }
  }

  reconnectPlayer(oldSocketId, newSocketId) {
    if (this.players[oldSocketId]) {
      const playerData = this.players[oldSocketId];
      playerData.socketId = newSocketId;
      playerData.connected = true;
      this.players[newSocketId] = playerData;
      delete this.players[oldSocketId];
      return playerData.playerIndex; // ✅ Returns original playerIndex
    }
    return null;
  }

  // ✅ Check if all players are disconnected
  allPlayersDisconnected() {
    return Object.values(this.players).every(p => !p.connected);
  }

  // ✅ Get socket ID of connected player (for sync)
  getConnectedPlayer() {
    for (const [socketId, player] of Object.entries(this.players)) {
      if (player.connected) {
        return socketId;
      }
    }
    return null;
  }

  isFullyConnected() { return this.gameState.playerCount >= 2; }

  setDeck(socketId, deck, imagePath, audioPath) {
    if (!this.players[socketId]) return;
    this.players[socketId].deck = deck || [];
    
    this.players[socketId].imagePath = imagePath || '';
    this.players[socketId].audioPath = audioPath || '';
    this.players[socketId].deckReady = true;
    const idx = this.players[socketId].playerIndex;
    this.gameState.deckReady[`player${idx + 1}`] = true;
    this.imageAudioPaths[`player${idx + 1}`] = { imagePath: imagePath || '', audioPath: audioPath || '' };
  }

  areBothDecksReady() {
    return this.gameState.deckReady.player1 && this.gameState.deckReady.player2;
  }
}

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('createRoom', ({ roomName, password }, cb) => {
    if (!roomName) return cb && cb({ success: false, error: 'Missing roomName' });
    if (rooms.has(roomName)) return cb && cb({ success: false, error: 'Room exists' });
    const room = new GameRoom(roomName, password);
    room.addPlayer(socket.id, 0); // ✅ Always index 0
    rooms.set(roomName, room);
    socket.join(roomName);
    socket.playerIndex = 0;
    socket.currentRoom = roomName;
    console.log(`Room created: ${roomName} by ${socket.id} (Player 0)`);
    cb && cb({ success: true, playerIndex: 0, roomName });
  });

  socket.on('joinRoom', ({ roomName, password }, cb) => {
    if (!roomName) return cb && cb({ success: false, error: 'Missing roomName' });
    if (!rooms.has(roomName)) return cb && cb({ success: false, error: 'Room not found' });
    const room = rooms.get(roomName);
    if (room.password && password !== room.password) return cb && cb({ success: false, error: 'Wrong password' });
    if (room.isFullyConnected()) return cb && cb({ success: false, error: 'Room full' });
    room.addPlayer(socket.id, 1); // ✅ Always index 1
    socket.join(roomName);
    socket.playerIndex = 1;
    socket.currentRoom = roomName;
    console.log(`Socket ${socket.id} joined room ${roomName} (Player 1)`);
    io.to(roomName).emit('playerJoined', { playerIndex: 1, roomName, gameState: room.gameState });
    cb && cb({ success: true, playerIndex: 1, roomName });
  });

  // ✅ Handle reconnection
  socket.on('reconnectToRoom', ({ roomName, password, playerIndex }, cb) => {
    console.log(`[RECONNECT] ${socket.id} attempting to reconnect as player ${playerIndex}`);

    if (!roomName) return cb && cb({ success: false, error: 'Missing roomName' });
    if (!rooms.has(roomName)) return cb && cb({ success: false, error: 'Room not found' });

    const room = rooms.get(roomName);

    if (room.password && password !== room.password) {
      return cb && cb({ success: false, error: 'Wrong password' });
    }

    // Find disconnected player with this index
    let oldSocketId = null;
    for (const [sid, player] of Object.entries(room.players)) {
      if (player.playerIndex === playerIndex && !player.connected) {
        oldSocketId = sid;
        break;
      }
    }

    if (!oldSocketId) {
      console.log(`[RECONNECT] No disconnected player found with index ${playerIndex}`);
      return cb && cb({ success: false, error: 'No disconnected player slot found' });
    }

    // Clear disconnection timer
    const timerKey = `${roomName}-${oldSocketId}`;
    if (disconnectionTimers.has(timerKey)) {
      clearTimeout(disconnectionTimers.get(timerKey));
      disconnectionTimers.delete(timerKey);
      console.log(`[RECONNECT] Cleared timer for ${timerKey}`);
    }

    // Reconnect player - playerIndex stays the same ✅
    const reconnectedIndex = room.reconnectPlayer(oldSocketId, socket.id);
    if (reconnectedIndex === null) {
      return cb && cb({ success: false, error: 'Reconnection failed' });
    }

    socket.join(roomName);
    socket.playerIndex = reconnectedIndex; // ✅ Restore original playerIndex
    socket.currentRoom = roomName;

    // Notify other players
    socket.to(roomName).emit('playerReconnected', {
      playerIndex: reconnectedIndex,
      message: 'Opponent reconnected!'
    });

    console.log(`[RECONNECT] ✅ ${socket.id} reconnected as player ${reconnectedIndex}`);

    cb && cb({
      success: true,
      playerIndex: reconnectedIndex
    });
  });

  // ✅ NEW: Request game state sync
  socket.on('requestGameStateSync', ({ roomName }) => {
    if (!roomName || !rooms.has(roomName)) return;

    const room = rooms.get(roomName);
    const connectedPlayer = room.getConnectedPlayer();

    if (connectedPlayer && connectedPlayer !== socket.id) {
      console.log(`[SYNC] Requesting state from ${connectedPlayer} for ${socket.id}`);
      // Ask the connected player to send their game state
      io.to(connectedPlayer).emit('provideGameState', {
        requesterId: socket.id
      });
    } else {
      console.log(`[SYNC] No other connected player to sync from`);
    }
  });

  // ✅ NEW: Provide game state to reconnecting player
  socket.on('sendGameState', ({ roomName, gameState, targetSocketId }) => {
    if (!roomName || !targetSocketId) return;

    console.log(`[SYNC] Sending game state from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('receiveGameState', { gameState });
  });

  socket.on('setDeck', ({ roomName, deck,  imagePath, audioPath }) => {
    if (!roomName || !rooms.has(roomName)) return;
    const room = rooms.get(roomName);
    room.setDeck(socket.id, deck,  imagePath, audioPath);
    io.to(roomName).emit('deckStatusUpdate', {
      player1Ready: room.gameState.deckReady.player1,
      player2Ready: room.gameState.deckReady.player2
    });

    if (room.areBothDecksReady()) {
      room.gameState.gameStarted = true;

      const decksArray = [null, null];
      
      for (const socketId in room.players) {
        const player = room.players[socketId];
        decksArray[player.playerIndex] = player.deck || [];
        
      }

      function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }

      decksArray[0] = shuffleArray(decksArray[0]);
      decksArray[1] = shuffleArray(decksArray[1]);

      const payload = {
        gameState: room.gameState,
        imageAudioPaths: room.imageAudioPaths,
        decks: decksArray,
       
      };

      console.log(`Game started in room ${roomName}`);
      io.to(roomName).emit('gameStart', payload);
    }
  });

  socket.on('action', (payload) => {
    const roomName = socket.currentRoom;
    if (!roomName) return;
    const msg = Object.assign({}, payload, { senderIndex: socket.playerIndex });
    socket.to(roomName).emit('action', msg);
  });

  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] Socket ${socket.id} disconnected`);
    const roomName = socket.currentRoom;

    if (roomName && rooms.has(roomName)) {
      const room = rooms.get(roomName);
      const player = room.players[socket.id];

      if (!player) {
        console.log(`[DISCONNECT] Player not found in room`);
        return;
      }

      console.log(`[DISCONNECT] Player ${player.playerIndex} in room ${roomName}`);

      // Mark as disconnected
      room.markDisconnected(socket.id);
      // ✅ NEW: If ALL players are disconnected, delete room immediately
      if (room.allPlayersDisconnected()) {
        console.log(`[CLEANUP] 🚨 All players disconnected. Deleting room ${roomName} immediately`);

        // Clear all timers for this room
        for (const [key, timer] of disconnectionTimers.entries()) {
          if (key.startsWith(roomName)) {
            clearTimeout(timer);
            disconnectionTimers.delete(key);
          }
        }

        rooms.delete(roomName);
        return; // ⛔ Stop here – no 60s timer
      }


      // Notify remaining player immediately
      socket.to(roomName).emit('playerDisconnected', {
        playerIndex: player.playerIndex,
        waiting: true,
        message: 'Opponent disconnected. Waiting for reconnection...'
      });

      console.log(`[DISCONNECT] Starting 60s timer for ${socket.id}`);

      // 60 second grace period before removing player
      const timerKey = `${roomName}-${socket.id}`;
      const timerId = setTimeout(() => {
        console.log(`[TIMEOUT] Player ${socket.id} did not reconnect in time`);

        if (!rooms.has(roomName)) {
          console.log(`[TIMEOUT] Room ${roomName} no longer exists`);
          return;
        }

        const room = rooms.get(roomName);
        room.removePlayer(socket.id);

        console.log(`[TIMEOUT] Remaining players: ${room.gameState.playerCount}`);

        // Check if room is now empty
        if (room.gameState.playerCount === 0) {
          // Clear all timers for this room
          for (const [key, timer] of disconnectionTimers.entries()) {
            if (key.startsWith(roomName)) {
              clearTimeout(timer);
              disconnectionTimers.delete(key);
            }
          }

          rooms.delete(roomName);
          console.log(`[CLEANUP] ✅ Room ${roomName} deleted - all players timed out`);
        } else {
          // Notify remaining player
          io.to(roomName).emit('playerTimeout', {
            playerIndex: player.playerIndex,
            message: 'Opponent failed to reconnect. Returning to lobby...'
          });
        }

        disconnectionTimers.delete(timerKey);
      }, 60000);

      disconnectionTimers.set(timerKey, timerId);
      console.log(`[DISCONNECT] Timer ${timerKey} set - room kept alive for 60s`);
    } else {
      console.log(`[DISCONNECT] Room ${roomName} not found or socket not in room`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Yu-Gi-Oh Server running on port ${PORT}`);
}); 