import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LocalCanvas from './pages/LocalCanvas.js';
import RoomCanvas from './pages/RoomCanvas.js';
import { useTheme } from './hooks/useTheme.js';
import { useKeyboard } from './hooks/useKeyboard.js';

function App() {
  // Initialize global hooks
  useTheme();
  useKeyboard();

  return (
    <Router>
      <div className="w-screen h-screen overflow-hidden bg-background-primary transition-colors duration-300">
        <Routes>
          <Route path="/" element={<LocalCanvas />} />
          <Route path="/room/:id" element={<RoomCanvas />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
