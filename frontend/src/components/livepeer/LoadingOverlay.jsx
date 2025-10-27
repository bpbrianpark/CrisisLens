import React, { useState, useEffect } from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ 
  isLoading, 
  duration = 1500, 
  message = "Loading...",
  onComplete 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, duration, onComplete]);

  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
