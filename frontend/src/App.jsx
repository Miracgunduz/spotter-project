import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function App() {
  const [formData, setFormData] = useState({
    currentLocation: '', pickupLocation: '', dropoffLocation: '', cycleUsed: ''
  })
  const [logs, setLogs] = useState([])
  const [waypoints, setWaypoints] = useState([])
  const canvasRef = useRef(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let res = await fetch('http://127.0.0.1:8000/api/calculate-route/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      let data = await res.json()
      if(data.logs) setLogs(data.logs)
      if(data.waypoints) setWaypoints(data.waypoints)
    } catch (err) { console.log(err) }
  }

  useEffect(() => {
    if (logs.length === 0 || !canvasRef.current) return;
    let ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 513, 518);
    let startX = 75; let endX = 460; let totalGridWidth = endX - startX;
    let yPositions = { 1: 205, 2: 220, 3: 235, 4: 250 };
    ctx.beginPath(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3; ctx.lineJoin = "round";
    let currentX = startX; let lastY = null;
    logs.forEach(log => {
      let drawHours = log.durationHours > 24 ? 24 : log.durationHours;
      let widthInPixels = (drawHours / 24) * totalGridWidth;
      let currentY = yPositions[log.status];
      if (lastY !== null && lastY !== currentY) ctx.lineTo(currentX, currentY);
      else if (lastY === null) ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX + widthInPixels, currentY);
      currentX += widthInPixels; lastY = currentY;
    });
    ctx.stroke();
  }, [logs]);

  return (
    <div className="dashboard-wrapper">
      
      { }
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        :root, body, html { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 100vw !important; 
          height: 100vh !important; 
          background: #020617; 
          overflow: hidden !important; 
        }
        
        #root {
          margin: 0 !important;
          padding: 0 !important;
          max-width: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .dashboard-wrapper {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          font-family: 'Inter', sans-serif;
          color: #f8fafc;
          box-sizing: border-box;
        }

        
        .sidebar {
          width: 300px; 
          flex-shrink: 0;
          background: #0f172a;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          height: 100vh;
          box-sizing: border-box;
          z-index: 100;
        }

        .sidebar-left {
          border-right: 1px solid #1e293b;
          box-shadow: 10px 0 30px rgba(0,0,0,0.5);
        }

        .sidebar-right {
          border-left: 1px solid #1e293b;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }

        .main-content {
          flex-grow: 1;
          min-width: 0;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden; 
          background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          box-sizing: border-box;
          gap: 40px;
        }

        .section-header {
          font-size: 0.75rem;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 3px;
          font-weight: 900;
          margin-bottom: 25px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 15px;
          display: flex;
          justify-content: space-between;
        } 

        .input-group { margin-bottom: 20px; }
        .input-label { display: block; font-size: 0.65rem; color: #64748b; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
        .premium-input {
          width: 100%; padding: 14px; background: #020617; border: 2px solid #334155;
          border-radius: 4px; color: #fff; font-weight: 700; font-size: 0.85rem;
          outline: none; transition: all 0.3s ease; box-sizing: border-box;
        }
        .premium-input:focus { border-color: #3b82f6; transform: scale(1.04); box-shadow: 0 0 15px rgba(59,130,246,0.3); }

        .action-btn {
          width: 100%; padding: 16px; background: #3b82f6; color: #fff; border: none;
          border-radius: 4px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;
          cursor: pointer; transition: 0.3s; margin-top: 10px; font-size: 0.9rem;
        }
        .action-btn:hover { background: #2563eb; transform: translateY(-2px); }
        
        .glass-panel {
          width: 100%; max-width: 900px; 
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        .log-row {
          padding: 14px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; font-size: 0.75rem;
        }
        .log-code { color: #3b82f6; font-weight: 900; margin-right: 8px; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>

      {}
      <aside className="sidebar sidebar-left">
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
            SPOTTER <span style={{ color: '#3b82f6' }}>AI</span>
          </h1>
          
        </div>

        <div className="section-header">Configuration</div>
        
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Current Location', name: 'currentLocation', placeholder: 'Origin' },
            { label: 'Pickup point', name: 'pickupLocation', placeholder: 'Loading' },
            { label: 'Destination', name: 'dropoffLocation', placeholder: 'Unloading' },
            { label: 'Cycle Hours Used', name: 'cycleUsed', placeholder: 'HOS Balance' }
          ].map((f, i) => (
            <div className="input-group" key={i}>
              <label className="input-label">{f.label}</label>
              <input 
                className="premium-input"
                name={f.name}
                type={f.name === 'cycleUsed' ? 'number' : 'text'}
                placeholder={f.placeholder}
                required
                onChange={(e) => { e.target.setCustomValidity(''); handleChange(e); }}
                onInvalid={(e) => e.target.setCustomValidity('Please fill out this field.')}
              />
            </div>
          ))}
          <button type="submit" className="action-btn">Initialize</button>
        </form>
      </aside>

      {}
      <main className="main-content">
        {logs.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: 0.3 }}>
            <h2 style={{ letterSpacing: '5px', textTransform: 'uppercase', textAlign: 'center', fontSize: '1.2rem' }}>Waiting for Data</h2>
          </div>
        ) : (
          <>
            <div className="glass-panel">
              <div className="section-header">
                <span>Satellite Tracking</span>
                <span style={{ color: '#22c55e' }}>● ACTIVE</span>
              </div>
              <div style={{ borderRadius: '4px', overflow: 'hidden', border: '2px solid #000' }}>
                <MapContainer bounds={waypoints} style={{ height: '350px', width: '100%', zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Polyline positions={waypoints} color="#3b82f6" weight={6} />
                  <Marker position={waypoints[0]} icon={customIcon} /><Marker position={waypoints[1]} icon={customIcon} /><Marker position={waypoints[2]} icon={customIcon} />
                </MapContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="section-header" style={{ width: '100%' }}>Official Digital Manifest</div>
              <div style={{ position: 'relative', width: '513px', height: '518px', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                <img src="/blank-paper-log.png" alt="log" style={{ position: 'absolute', top: 0, left: 0, width: '513px', height: '518px' }} />
                <canvas ref={canvasRef} width="513" height="518" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
              </div>
            </div>
          </>
        )}
      </main>

      {}
      <aside className="sidebar sidebar-right">
        <div className="section-header">Compliance Feed</div>
        {logs.length === 0 ? (
          <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center', marginTop: '50px' }}>Systems Idle...</p>
        ) : (
          <div style={{ overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} className="log-row">
                <span><span className="log-code">S{log.status}</span> {log.note}</span>
                <span style={{ color: '#3b82f6', fontWeight: '900' }}>{log.durationHours}h</span>
              </div>
            ))}
          </div>
        )}
      </aside>

    </div>
  )
}

export default App;