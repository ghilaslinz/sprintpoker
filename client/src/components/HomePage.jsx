import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const ROOM_NAME_REGEX = /^[A-Za-z0-9_]+$/;

function HomePage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!roomName.trim()) {
      setError('Room name is required.');
      return;
    }
    if (!ROOM_NAME_REGEX.test(roomName)) {
      setError('Use letters, numbers, and underscores only.');
      return;
    }
    navigate(`/room/${roomName}`);
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Sprint Poker</h1>
        <p className="subtitle">Estimate effort in hours with your team.</p>
        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="roomName" className="label">
            Room name
          </label>
          <input
            id="roomName"
            type="text"
            className="input"
            value={roomName}
            onChange={(event) => {
              setRoomName(event.target.value);
              setError('');
            }}
            placeholder="e.g. sprint_planning"
            autoComplete="off"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="button">
            Join room
          </button>
        </form>
      </div>
    </div>
  );
}

export default HomePage;
