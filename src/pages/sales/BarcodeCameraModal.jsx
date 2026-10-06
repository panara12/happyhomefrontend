import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { Camera, X } from 'lucide-react';

const COOLDOWN_MS = 2000;
const FORMATS = ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'];

export function BarcodeCameraModal({ onScan, onClose }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const lastRef = useRef({ code: '', time: 0 });
  const trackRef = useRef(null);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');       // shows real resolution
  const [lastCode, setLastCode] = useState('');
  const [zoom, setZoom] = useState(null);

  const handleCode = (raw) => {
    const code = String(raw || '').trim();
    const now = Date.now();
    if (!code) return;
    if (code === lastRef.current.code && now - lastRef.current.time < COOLDOWN_MS) return;
    lastRef.current = { code, time: now };
    setLastCode(code);
    navigator.vibrate?.(100);
    onScanRef.current(code);
  };

  useEffect(() => {
    let cancelled = false;
    let stream;
    let timer;
    const detector = new BarcodeDetector({ formats: FORMATS });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());

        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        // continuous autofocus + zoom range, where the phone supports it
        const caps = track.getCapabilities?.() || {};
        if (caps.focusMode?.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
        if (caps.zoom) {
          setZoom({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1, value: caps.zoom.min });
        }

        const s = track.getSettings();
        setInfo(`Camera: ${s.width}x${s.height}`);

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const tick = async () => {
          if (cancelled) return;
          try {
            if (video.readyState >= 2) {
              const results = await detector.detect(video);
              if (results[0]) handleCode(results[0].rawValue);
            }
          } catch {}
          timer = setTimeout(tick, 150);
        };
        tick();
      } catch (err) {
        const msg = String(err?.message || err);
        if (/permission|denied|notallowed/i.test(msg)) setError('Camera permission denied. Allow camera access in the browser settings.');
        else if (/secure|https/i.test(msg)) setError('Camera needs HTTPS.');
        else setError('Could not start the camera. ' + msg);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleZoom = (value) => {
    setZoom((z) => ({ ...z, value }));
    trackRef.current?.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {});
  };

  // backup: take a photo with the phone's own camera app (full 4K + native autofocus)
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new BarcodeDetector({ formats: FORMATS });
      const results = await detector.detect(bitmap);
      if (results[0]) handleCode(results[0].rawValue);
      else setError('No barcode found in the photo. Retake it closer and sharper.');
    } catch {
      setError('Could not read the photo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">Scan barcode</h3>
          <button onClick={onClose} className="p-1 text-gray-500" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4">
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} playsInline muted className="w-full max-h-[50vh] object-contain" />
            {/* guide line */}
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-red-500/70 pointer-events-none" />
          </div>

          <p className="text-xs text-gray-500 mt-2">{info} · Keep the barcode horizontal on the red line, 15-20 cm away.</p>

          {zoom && (
            <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={zoom.value}
              onChange={(e) => handleZoom(Number(e.target.value))} className="w-full mt-3" />
          )}

          {lastCode && <p className="text-sm text-green-700 mt-2">Last scanned: {lastCode}</p>}

          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="mt-3 w-full px-4 py-2 border border-amber-600 text-amber-700 rounded-lg flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Take photo instead
          </button>

          <button onClick={onClose} className="mt-2 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            Done
          </button> 
        </div>
      </div>
    </div>
  );
}