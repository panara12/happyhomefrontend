import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { Camera, X, Zap } from 'lucide-react';

const COOLDOWN_MS = 2000;
const FORMATS = ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'];

export function BarcodeCameraModal({ onScan, onClose }) {
  const videoRef = useRef(null);      // <-- the missing line
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const lastRef = useRef({ code: '', time: 0 });

  const [hd, setHd] = useState(false);
  const [canHd, setCanHd] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const hdRef = useRef(false);
  hdRef.current = hd;


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
setHasTorch(Boolean(caps.torch));

const imageCapture = 'ImageCapture' in window ? new ImageCapture(track) : null;
setCanHd(Boolean(imageCapture?.takePhoto));

const video = videoRef.current;
video.srcObject = stream;
await video.play();

const canvas = (canvasRef.current ||= document.createElement('canvas'));

const tick = async () => {
  if (cancelled) return;
  let delay = 120;
  try {
    let source = null;

    if (hdRef.current && imageCapture) {
      // full-sensor still, same quality as the camera app
      const blob = await imageCapture.takePhoto();
      source = await createImageBitmap(blob);
      delay = 400;
    } else if (video.readyState >= 2 && video.videoWidth) {
      // decode only the middle strip, at native resolution
      const vw = video.videoWidth, vh = video.videoHeight;
      const sx = Math.floor(vw * 0.05), sw = Math.floor(vw * 0.9);
      const sy = Math.floor(vh * 0.25), sh = Math.floor(vh * 0.5);
      canvas.width = sw;
      canvas.height = sh;
      canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      source = canvas;
    }

    if (source) {
      const results = await detector.detect(source);
      if (results[0]) handleCode(results[0].rawValue);
      source.close?.();
    }
  } catch {}
  timer = setTimeout(tick, delay);
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

  const refocus = async () => {
  const track = trackRef.current;
  const caps = track?.getCapabilities?.() || {};
  if (!caps.focusMode) return;
  try {
    await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] });
    setTimeout(() => track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {}), 900);
  } catch {}
};

const toggleTorch = () => {
  const next = !torchOn;
  setTorchOn(next);
  trackRef.current?.applyConstraints({ advanced: [{ torch: next }] }).catch(() => {});
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
            <video ref={videoRef} onClick={refocus} playsInline muted className="w-full max-h-[50vh] object-contain" />
            {/* guide line */}
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-red-500/70 pointer-events-none" />
          </div>

          <p className="text-xs text-gray-500 mt-2">{info} · Keep the barcode horizontal on the red line, 15-20 cm away.</p>

          {zoom && (
            <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={zoom.value}
              onChange={(e) => handleZoom(Number(e.target.value))} className="w-full mt-3" />
          )}

          <div className="flex gap-2 mt-3">
  {canHd && (
    <button
      onClick={() => setHd((v) => !v)}
      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${hd ? 'bg-amber-600 text-white border-amber-600' : 'border-gray-300 text-gray-700'}`}
    >
      HD mode {hd ? 'ON' : 'OFF'}
    </button>
  )}
  {hasTorch && (
    <button onClick={toggleTorch} className="px-3 py-2 rounded-lg border border-gray-300 text-sm flex items-center gap-1">
      <Zap className="w-4 h-4" /> {torchOn ? 'Light off' : 'Light on'}
    </button>
  )}
</div>

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