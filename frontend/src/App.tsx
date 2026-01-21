import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Stream from './pages/Stream';
import Watch from './pages/Watch';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream" element={<Stream />} />
        <Route path="/stream/:roomId" element={<Stream />} />
        <Route path="/watch" element={<Watch />} />
        <Route path="/watch/:roomId" element={<Watch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
