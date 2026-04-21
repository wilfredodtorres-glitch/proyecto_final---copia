import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess, onScanError, onClose }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', background: 'white', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#eee',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            zIndex: 2001
          }}
        >✕</button>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Escanear Código QR</h3>
        <div id="reader" style={{ width: '100%' }}></div>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
          Coloque el código QR del estudiante frente a la cámara
        </p>
      </div>
    </div>
  );
}
