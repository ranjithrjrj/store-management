// FILE PATH: components/BarcodeScanner.tsx
// Mobile Camera Barcode Scanner Component

'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

type BarcodeScannerProps = {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Scanning in progress (this fires continuously, ignore it)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="text-white" size={24} />
            <h3 className="text-xl font-bold text-white">Scan Barcode</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <XCircle size={48} className="mx-auto text-red-500 mb-4" />
              <p className="text-red-600 font-semibold mb-2">Camera Error</p>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <p className="text-xs text-slate-500">
                Please allow camera access in your browser settings and try again.
              </p>
            </div>
          ) : (
            <>
              <div 
                id="barcode-reader" 
                className="rounded-lg overflow-hidden border-4 border-teal-500"
              />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Position the barcode within the camera frame
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Supported: UPC, EAN, Code128, Code39, QR codes
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
