import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats as F } from 'html5-qrcode';
import { X } from 'lucide-react';

const REGION_ID = 'barcode-camera-region';
const COOLDOWN_MS = 2000; // ignore the same code scanned again within 2s

export function BarcodeCameraModal({ onScan, onClose }) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const lastRef = useRef({ code: '', time: 0 });
  const [error, setError] = useState('');
  const [lastCode, setLastCode] = useState('');

  const scannerRef = useRef(null);
const [zoom, setZoom] = useState(null); // { min, max, step, value }

useEffect(() => {
  const scanner = new Html5Qrcode(REGION_ID, {
    formatsToSupport: [F.CODE_128, F.CODE_39, F.EAN_13, F.EAN_8, F.UPC_A],
    useBarCodeDetectorIfSupported: true,
    verbose: false,
  });
  scannerRef.current = scanner;

  const startPromise = scanner
    .start(
      { facingMode: 'environment' },
      {
        fps: 15,
        disableFlip: true,
        // wide, relative scan box instead of a fixed 300x120
        qrbox: (w, h) => ({
          width: Math.floor(w * 0.9),
          height: Math.floor(Math.min(h * 0.5, 160)),
        }),
        videoConstraints: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
      (decodedText) => {
        const code = decodedText.trim();
        const now = Date.now();
        if (!code) return;
        if (code === lastRef.current.code && now - lastRef.current.time < COOLDOWN_MS) return;
        lastRef.current = { code, time: now };
        setLastCode(code);
        navigator.vibrate?.(100);
        onScanRef.current(code);
      },
      () => {}
    )
    .then(async () => {
      // ask for continuous autofocus (works on Android Chrome)
      await scanner
        .applyVideoConstraints({ advanced: [{ focusMode: 'continuous' }] })
        .catch(() => {});
      // zoom slider if the phone supports it
      const caps = scanner.getRunningTrackCapabilities?.();
      if (caps?.zoom) {
        setZoom({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1, value: caps.zoom.min });
      }
    })
    .catch((err) => {
      const msg = String(err?.message || err);
      if (/permission|denied|notallowed/i.test(msg)) {
        setError('Camera permission denied. Allow camera access in the browser settings and try again.');
      } else if (/secure|https/i.test(msg)) {
        setError('Camera needs HTTPS. Open the site over https://.');
      } else {
        setError('Could not start the camera. ' + msg);
      }
    });

  return () => {
    startPromise
      .then(() => scanner.stop())
      .then(() => scanner.clear())
      .catch(() => {});
  };
}, []);

const handleZoom = (value) => {
  setZoom((z) => ({ ...z, value }));
  scannerRef.current?.applyVideoConstraints({ advanced: [{ zoom: value }] }).catch(() => {});
};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">Scan barcode</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <>
              <div id={REGION_ID} className="w-full rounded-lg overflow-hidden bg-black min-h-[240px]" />
              <p className="text-xs text-gray-500 mt-2">
                Hold the barcode inside the box, about 10-15 cm from the camera. Good light helps.
              </p>
              {lastCode && <p className="text-sm text-green-700 mt-2">Last scanned: {lastCode}</p>}
            </>
          )}
          {zoom && (
            <input
              type="range"
              min={zoom.min}
              max={zoom.max}
              step={zoom.step}
              value={zoom.value}
              onChange={(e) => handleZoom(Number(e.target.value))}
              className="w-full mt-3"
            />
          )}
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}