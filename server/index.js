import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      hostId: null,
      showVotes: false,
      controlsLocked: false,
      message: ''
    });
  }
  return rooms.get(roomId);
}

function broadcastRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const participants = Array.from(room.participants.values()).map((participant) => ({
    id: participant.id,
    name: participant.name,
    estimate: participant.estimate,
    isHost: participant.id === room.hostId
  }));
  io.to(roomId).emit('roomState', {
    participants,
    showVotes: room.showVotes,
    controlsLocked: room.controlsLocked,
    message: room.message,
    hostId: room.hostId
  });
}

io.on('connection', (socket) => {
  let joinedRoomId = null;

  socket.on('joinRoom', ({ roomId, name }) => {
    if (!roomId || !name) {
      return;
    }
    const room = getRoom(roomId);
    socket.join(roomId);
    joinedRoomId = roomId;

    const isHost = room.participants.size === 0;
    const participant = {
      id: socket.id,
      name,
      estimate: null
    };
    room.participants.set(socket.id, participant);
    if (isHost || !room.hostId) {
      room.hostId = socket.id;
    }
    broadcastRoomState(roomId);
    socket.emit('roomJoined', {
      roomId,
      isHost: socket.id === room.hostId
    });
  });

  socket.on('updateEstimate', (estimate) => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (!participant) return;
    if (room.controlsLocked && socket.id !== room.hostId) return;

    participant.estimate = estimate;
    broadcastRoomState(joinedRoomId);
  });

  socket.on('updateMessage', (message) => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room) return;
    if (room.controlsLocked && socket.id !== room.hostId) return;
    room.message = message;
    broadcastRoomState(joinedRoomId);
  });

  socket.on('showVotes', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room || room.hostId !== socket.id) return;
    room.showVotes = true;
    broadcastRoomState(joinedRoomId);
  });

  socket.on('clearVotes', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room || room.hostId !== socket.id) return;
    room.showVotes = false;
    for (const participant of room.participants.values()) {
      participant.estimate = null;
    }
    broadcastRoomState(joinedRoomId);
  });

  socket.on('toggleLock', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room || room.hostId !== socket.id) return;
    room.controlsLocked = !room.controlsLocked;
    broadcastRoomState(joinedRoomId);
  });

  socket.on('disconnect', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room) return;
    room.participants.delete(socket.id);
    if (room.hostId === socket.id) {
      const nextHost = room.participants.keys().next().value || null;
      room.hostId = nextHost;
    }
    if (room.participants.size === 0) {
      rooms.delete(joinedRoomId);
    } else {
      broadcastRoomState(joinedRoomId);
    }
  });
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
