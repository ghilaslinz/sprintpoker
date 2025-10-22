import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './RoomPage.css';

function useLocalName(roomId) {
  const storageKey = `sprintpoker:name:${roomId}`;
  const [name, setName] = useState(() => localStorage.getItem(storageKey) || '');

  const saveName = (value) => {
    localStorage.setItem(storageKey, value);
    setName(value);
  };

  return [name, saveName];
}

function getAverageEstimate(participants) {
  const numericEstimates = participants
    .map((participant) =>
      participant.estimate === null || participant.estimate === undefined
        ? null
        : Number(participant.estimate)
    )
    .filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (numericEstimates.length === 0) {
    return null;
  }
  const total = numericEstimates.reduce((sum, value) => sum + value, 0);
  return total / numericEstimates.length;
}

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [storedName, saveName] = useLocalName(roomId);
  const [pendingName, setPendingName] = useState(storedName);
  const [hasJoined, setHasJoined] = useState(Boolean(storedName));
  const [roomState, setRoomState] = useState({
    participants: [],
    showVotes: false,
    controlsLocked: false,
    message: '',
    hostId: null
  });
  const [isHost, setIsHost] = useState(false);
  const [message, setMessage] = useState('');
  const [estimateInput, setEstimateInput] = useState('');

  const socket = useMemo(() => io({ autoConnect: false }), []);

  useEffect(() => {
    socket.connect();

    socket.on('roomState', (state) => {
      setRoomState(state);
      setMessage(state.message ?? '');
      const self = state.participants.find((participant) => participant.id === socket.id);
      if (self) {
        if (self.estimate === null || self.estimate === undefined) {
          setEstimateInput('');
        } else {
          setEstimateInput(String(self.estimate));
        }
      }
    });

    socket.on('roomJoined', ({ isHost: host }) => {
      setIsHost(host);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (hasJoined && storedName) {
      socket.emit('joinRoom', { roomId, name: storedName });
    }
  }, [hasJoined, socket, roomId, storedName]);

  const handleNameSubmit = (event) => {
    event.preventDefault();
    const trimmed = pendingName.trim();
    if (!trimmed) {
      return;
    }
    saveName(trimmed);
    setHasJoined(true);
  };
const commitEstimate = () => {
  if (estimateInput === '') {
    socket.emit('updateEstimate', null);
    return;
  }

  const numericValue = Number(estimateInput);
  if (!Number.isNaN(numericValue)) {
    socket.emit('updateEstimate', numericValue);
  }
};

const handleEstimateChange = (event) => {
  const { value } = event.target;
  setEstimateInput(value);
};

const handleEstimateKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitEstimate();
  }
};


    if (!Number.isNaN(numericValue)) {
      socket.emit('updateEstimate', numericValue);
    }
  };

  const handleEstimateChange = (event) => {
    const { value } = event.target;
    setEstimateInput(value);
  };

  const handleEstimateKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEstimate();
    }
  };

  const handleMessageChange = (event) => {
    const { value } = event.target;
    setMessage(value);
    socket.emit('updateMessage', value);
  };

  const handleShowVotes = () => {
    socket.emit('showVotes');
  };

  const handleClearVotes = () => {
    socket.emit('clearVotes');
  };

  const handleToggleLock = () => {
    socket.emit('toggleLock');
  };

  const handleLeave = () => {
    socket.disconnect();
    navigate('/');
  };

  const averageEstimate = roomState.showVotes ? getAverageEstimate(roomState.participants) : null;
  const abstained = roomState.participants.filter(
    (participant) => participant.estimate === null || participant.estimate === undefined || participant.estimate === ''
  );

  return (
    <div className="room-page">
      <header className="room-header">
        <div>
          <h1 className="room-title">Room: {roomId}</h1>
          <p className="room-subtitle">Share this link to invite teammates.</p>
          <p className="room-link">{window.location.href}</p>
        </div>
        <button className="secondary-button" onClick={handleLeave}>
          Leave room
        </button>
      </header>

      {!hasJoined && (
        <div className="name-overlay" role="dialog" aria-modal="true">
          <form className="name-form" onSubmit={handleNameSubmit}>
            <h2>Enter your name</h2>
            <input
              type="text"
              value={pendingName}
              onChange={(event) => setPendingName(event.target.value)}
              placeholder="Your name"
              required
            />
            <button type="submit" className="primary-button">
              Join room
            </button>
          </form>
        </div>
      )}

      <section className="message-card">
        <label htmlFor="shared-message" className="section-label">
          Shared message
        </label>
        <input
          id="shared-message"
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Add a story summary or agenda for everyone"
          disabled={roomState.controlsLocked && !isHost}
        />
        {roomState.controlsLocked && !isHost && <p className="helper-text">Controls are locked by the host.</p>}
      </section>

      <section className="participants-card">
        <div className="participants-header">
          <h2>Participants</h2>
          <div className="actions">
            {isHost && (
              <>
                <button className="primary-button" onClick={handleShowVotes}>
                  Show votes
                </button>
                <button className="secondary-button" onClick={handleClearVotes}>
                  Clear votes
                </button>
                <button className="secondary-button" onClick={handleToggleLock}>
                  {roomState.controlsLocked ? 'Unlock controls' : 'Lock controls'}
                </button>
              </>
            )}
          </div>
        </div>
        <ul className="participants-list">
          {roomState.participants.map((participant) => {
            const isSelf = participant.id === socket.id;
            let displayEstimate = '—';
            if (roomState.showVotes) {
              if (participant.estimate === null || participant.estimate === undefined || participant.estimate === '') {
                displayEstimate = 'Abstained';
              } else {
                displayEstimate = participant.estimate;
              }
            } else {
              displayEstimate = participant.estimate !== null && participant.estimate !== undefined ? '•' : '—';
            }
            return (
              <li key={participant.id} className="participant-item">
                <div>
                  <p className="participant-name">
                    {participant.name} {participant.id === roomState.hostId && <span className="badge">Host</span>}
                  </p>
                </div>
                <div className="participant-input">
                  {isSelf ? (
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={estimateInput}
                      onChange={handleEstimateChange}
                      onKeyDown={handleEstimateKeyDown}
                      placeholder="?"
                      title="Press Enter to submit your estimate"
                      disabled={roomState.controlsLocked && !isHost}
                    />
                  ) : (
                    <span className={`estimate ${roomState.showVotes ? 'revealed' : ''}`}>{displayEstimate}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {roomState.showVotes && (
        <section className="results-card">
          <h2>Results</h2>
          {averageEstimate !== null ? (
            <p className="average">Average estimate: {averageEstimate.toFixed(2)} hours</p>
          ) : (
            <p className="average">No estimates yet.</p>
          )}
          {abstained.length > 0 && (
            <p className="abstained">Abstained: {abstained.map((participant) => participant.name).join(', ')}</p>
          )}
        </section>
      )}
    </div>
  );
}

export default RoomPage;
