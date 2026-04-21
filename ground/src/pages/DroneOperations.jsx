import { useState, useEffect } from 'react';
import { Camera, Gamepad2, Settings, RefreshCw, Volume2, VolumeX, Maximize, AlertCircle, Wifi, WifiOff, Battery, Compass, Activity, TrendingUp, Zap, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/DroneOperations.css';

export default function DroneOperations() {
  // Webcam State
  const [webcamURL, setWebcamURL] = useState('');
  const [cameraStatus, setCameraStatus] = useState('offline');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [showCameraSettings, setShowCameraSettings] = useState(false);

  // Drone Control State
  const [droneStatus, setDroneStatus] = useState('idle');
  const [battery, setBattery] = useState(85);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [showDroneSettings, setShowDroneSettings] = useState(false);

  const DEFAULT_CAMERA_URL = 'http://192.168.1.100:81/stream';

  // Initialize camera URL from storage
  useEffect(() => {
    const savedURL = localStorage.getItem('esp32CameraURL') || DEFAULT_CAMERA_URL;
    setWebcamURL(savedURL);
  }, []);

  // Simulate drone telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      if (droneStatus === 'flying') {
        setBattery(Math.max(0, battery - 0.5));
        setAltitude(Math.min(120, altitude + Math.random() * 5));
        setSpeed(Math.abs(pitch) * 0.5 + Math.random() * 2);
        setHeading((heading + yaw * 0.5) % 360);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [droneStatus, battery, altitude, pitch, yaw]);

  // Camera functions
  const connectCamera = async () => {
    if (!webcamURL.trim()) {
      toast.error('Please enter camera URL');
      return;
    }

    setCameraStatus('connecting');
    try {
      const response = await fetch(webcamURL, { method: 'HEAD', mode: 'no-cors' });
      setCameraStatus('online');
      localStorage.setItem('esp32CameraURL', webcamURL);
      toast.success('Camera connected!');
    } catch (err) {
      setCameraStatus('offline');
      toast.error('Failed to connect to camera');
    }
  };

  const disconnectCamera = () => {
    setCameraStatus('offline');
    toast.success('Camera disconnected');
  };

  const handleFullscreen = () => {
    const element = document.getElementById('camera-feed');
    if (element?.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  // Drone control functions
  const sendCommand = (command) => {
    console.log(`📡 Command: ${command}`);
    toast.success(`Command sent: ${command}`);
  };

  const handleArm = () => {
    if (droneStatus === 'idle') {
      if (battery < 20) {
        toast.error('Battery too low');
        return;
      }
      setDroneStatus('armed');
      sendCommand('ARM');
    }
  };

  const handleTakeoff = () => {
    if (droneStatus === 'armed') {
      setDroneStatus('flying');
      setThrottle(50);
      sendCommand('TAKEOFF');
    }
  };

  const handleLand = () => {
    if (droneStatus === 'flying') {
      setDroneStatus('armed');
      setThrottle(0);
      sendCommand('LAND');
    }
  };

  const handleEmergencyStop = () => {
    setDroneStatus('emergency');
    setThrottle(0);
    sendCommand('EMERGENCY_STOP');
    toast.error('Emergency stop!', { icon: '⚠️' });
  };

  return (
    <div className="drone-ops-container">
      <div className="drone-ops-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ops-header-icon">
              <Gamepad2 size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Drone Operations</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Live camera & flight control</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className={`status-indicator ${cameraStatus}`}>
              {cameraStatus === 'online' && <Wifi size={16} />}
              {cameraStatus === 'offline' && <WifiOff size={16} />}
              <span>Camera: {cameraStatus}</span>
            </div>
            <div className={`status-badge ${droneStatus}`}>
              <div className="status-pulse"></div>
              <span>{droneStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="drone-ops-layout">
        {/* Left: Camera Feed */}
        <div className="camera-section">
          {cameraStatus === 'offline' ? (
            <div className="camera-offline">
              <div className="offline-card">
                <AlertCircle size={48} color="#d94a3f" />
                <h2>Camera Offline</h2>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Stream URL
                  </label>
                  <input
                    type="text"
                    value={webcamURL}
                    onChange={(e) => setWebcamURL(e.target.value)}
                    placeholder="http://192.168.1.100:81/stream"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(0, 102, 204, 0.08)',
                      border: '1px solid rgba(0, 102, 204, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={connectCamera}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #0066cc, #004a99)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Connect Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="camera-active">
              <div id="camera-feed" className="camera-feed">
                <img
                  src={webcamURL}
                  alt="Drone Camera"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  }}
                />
                <div className="camera-overlay">
                  <div className="camera-info">
                    <span>🔴 LIVE - {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="camera-controls-bar">
                <button onClick={handleFullscreen} className="cam-btn" title="Fullscreen">
                  <Maximize size={16} />
                </button>
                <button onClick={() => setShowCameraSettings(!showCameraSettings)} className="cam-btn" title="Settings">
                  <Settings size={16} />
                </button>
                <button onClick={() => setAudioEnabled(!audioEnabled)} className="cam-btn" title={audioEnabled ? 'Mute' : 'Unmute'}>
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={disconnectCamera} className="cam-btn danger" title="Disconnect">
                  <WifiOff size={16} />
                </button>
              </div>

              {showCameraSettings && (
                <div className="camera-settings-mini">
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', display: 'block', color: 'var(--text-secondary)' }}>
                      Brightness: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', display: 'block', color: 'var(--text-secondary)' }}>
                      Contrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Drone Control */}
        <div className="control-section">
          {/* Telemetry Cards */}
          <div className="telemetry-grid">
            <div className="telemetry-card compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Battery size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Battery</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: battery < 20 ? '#dc2626' : '#10b981' }}>
                    {battery.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${battery}%` }}></div>
              </div>
            </div>

            <div className="telemetry-card compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Altitude</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#8b5cf6' }}>
                    {altitude.toFixed(1)}m
                  </div>
                </div>
              </div>
            </div>

            <div className="telemetry-card compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#0066cc" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Speed</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0066cc' }}>
                    {speed.toFixed(1)}m/s
                  </div>
                </div>
              </div>
            </div>

            <div className="telemetry-card compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="#d95f3a" />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Heading</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#d95f3a' }}>
                    {heading.toFixed(0)}°
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Control Buttons */}
          <div className="flight-controls">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>Flight Control</h3>

            {droneStatus === 'idle' && (
              <button onClick={handleArm} className="btn-flight btn-primary">
                <Zap size={18} /> ARM
              </button>
            )}

            {droneStatus === 'armed' && (
              <>
                <button onClick={handleTakeoff} className="btn-flight btn-success">
                  TAKEOFF
                </button>
                <button onClick={() => setDroneStatus('idle')} className="btn-flight btn-secondary">
                  DISARM
                </button>
              </>
            )}

            {droneStatus === 'flying' && (
              <>
                <button onClick={handleLand} className="btn-flight btn-warning">
                  LAND
                </button>
                <button onClick={() => setDroneStatus('armed')} className="btn-flight btn-secondary">
                  HOVER
                </button>
              </>
            )}

            {droneStatus === 'emergency' && (
              <button onClick={handleArm} className="btn-flight btn-primary">
                RECOVER
              </button>
            )}

            <button onClick={handleEmergencyStop} className="btn-flight btn-danger" style={{ marginTop: '8px' }}>
              <AlertTriangle size={18} /> E-STOP
            </button>
          </div>

          {/* Directional Controls - Only when Flying */}
          {droneStatus === 'flying' && (
            <div className="directional-controls">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>Movement</h3>
              <div className="dpad-container">
                {/* Top Row */}
                <div className="dpad-row">
                  <button
                    onClick={() => {
                      setPitch(50);
                      sendCommand('FORWARD');
                      setTimeout(() => setPitch(0), 500);
                    }}
                    className="dpad-btn dpad-up"
                    title="Move Forward"
                  >
                    ↑
                  </button>
                </div>

                {/* Middle Row */}
                <div className="dpad-row middle">
                  <button
                    onClick={() => {
                      setRoll(-50);
                      sendCommand('LEFT');
                      setTimeout(() => setRoll(0), 500);
                    }}
                    className="dpad-btn dpad-left"
                    title="Move Left"
                  >
                    ←
                  </button>
                  <div className="dpad-center">Center</div>
                  <button
                    onClick={() => {
                      setRoll(50);
                      sendCommand('RIGHT');
                      setTimeout(() => setRoll(0), 500);
                    }}
                    className="dpad-btn dpad-right"
                    title="Move Right"
                  >
                    →
                  </button>
                </div>

                {/* Bottom Row */}
                <div className="dpad-row">
                  <button
                    onClick={() => {
                      setPitch(-50);
                      sendCommand('BACKWARD');
                      setTimeout(() => setPitch(0), 500);
                    }}
                    className="dpad-btn dpad-down"
                    title="Move Backward"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Controls - Only when Flying */}
          {droneStatus === 'flying' && (
            <div className="manual-controls">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>Fine Tuning</h3>

              <div className="control-axis">
                <label>Throttle: {throttle.toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={throttle}
                  onChange={(e) => setThrottle(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="control-axis">
                <label>Pitch: {pitch.toFixed(0)}°</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="control-axis">
                <label>Roll: {roll.toFixed(0)}°</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={roll}
                  onChange={(e) => setRoll(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="control-axis">
                <label>Yaw: {yaw.toFixed(0)}°</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={yaw}
                  onChange={(e) => setYaw(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="system-status">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>System Status</h3>
            <div className="status-list-compact">
              <div className={`status-row ${droneStatus === 'idle' ? 'idle' : 'active'}`}>
                <span className="status-dot"></span>
                <span className="status-label">Flight Mode</span>
                <span className="status-value">{droneStatus}</span>
              </div>
              <div className={`status-row ${battery < 20 ? 'critical' : battery < 50 ? 'warning' : 'ok'}`}>
                <span className="status-dot"></span>
                <span className="status-label">Battery</span>
                <span className="status-value">{battery > 80 ? 'Good' : battery > 50 ? 'Fair' : 'Low'}</span>
              </div>
              <div className="status-row ok">
                <span className="status-dot"></span>
                <span className="status-label">GPS</span>
                <span className="status-value">Strong</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
