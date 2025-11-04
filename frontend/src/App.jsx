import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        {/* <Route path="/" element={<LandingPage />} /> */}
        {/* <Route path="/map" element={<MapPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}