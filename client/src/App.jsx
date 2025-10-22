import { Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import RoomPage from './components/RoomPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  );
}

export default App;
