// FILE PATH: app/debug/page.tsx
// Quick diagnostic page for Samsung tablet issues

'use client';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [info, setInfo] = useState<any>({});
  
  useEffect(() => {
    setInfo({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
      userAgent: navigator.userAgent,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      tailwindMd: window.matchMedia('(min-width: 768px)').matches,
      tailwindLg: window.matchMedia('(min-width: 1024px)').matches,
    });
  }, []);
  
  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-4xl font-bold text-black mb-8">Samsung Tablet Debug Page</h1>
      
      {/* Test basic Tailwind styles */}
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-black">Can you see these colored boxes?</h2>
        
        <div className="bg-red-500 p-6 text-white font-bold text-2xl rounded-lg">
          ✅ RED BOX - If you see this, Tailwind is working
        </div>
        
        <div className="bg-blue-500 p-6 text-white font-bold text-2xl rounded-lg">
          ✅ BLUE BOX - If you see this, colors work
        </div>
        
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white font-bold text-2xl rounded-lg">
          ✅ GRADIENT BOX - If you see this, gradients work
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm p-6 border-2 border-black rounded-lg">
          <p className="text-black font-bold text-xl">
            ⚠️ GLASS EFFECT - If you see this text clearly, backdrop-blur works
          </p>
        </div>
      </div>
      
      {/* Test icons/emojis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black mb-4">Can you see these icons?</h2>
        <div className="flex gap-6 text-6xl">
          <span>🏠</span>
          <span>📱</span>
          <span>⭐</span>
          <span>✅</span>
          <span>❌</span>
        </div>
      </div>
      
      {/* Test responsive classes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black mb-4">Responsive Test:</h2>
        <div className="space-y-2 text-xl font-bold">
          <div className="block sm:hidden bg-red-200 p-4 rounded">
            📱 Mobile (less than 640px)
          </div>
          <div className="hidden sm:block md:hidden bg-blue-200 p-4 rounded">
            📱 Small (640px - 767px)
          </div>
          <div className="hidden md:block lg:hidden bg-green-200 p-4 rounded">
            💻 Medium/Tablet (768px - 1023px)
          </div>
          <div className="hidden lg:block bg-purple-200 p-4 rounded">
            🖥️ Large/Desktop (1024px+)
          </div>
        </div>
      </div>
      
      {/* Device information */}
      <div className="bg-slate-100 p-6 rounded-lg border-2 border-slate-300">
        <h2 className="text-2xl font-bold text-black mb-4">Device Information:</h2>
        <div className="space-y-2">
          <p className="text-black"><strong>Screen Width:</strong> {info.width}px</p>
          <p className="text-black"><strong>Screen Height:</strong> {info.height}px</p>
          <p className="text-black"><strong>Device Pixel Ratio:</strong> {info.dpr}x</p>
          <p className="text-black"><strong>Color Scheme:</strong> {info.colorScheme}</p>
          <p className="text-black"><strong>Tailwind MD (768px+):</strong> {info.tailwindMd ? '✅ Yes' : '❌ No'}</p>
          <p className="text-black"><strong>Tailwind LG (1024px+):</strong> {info.tailwindLg ? '✅ Yes' : '❌ No'}</p>
        </div>
        
        <details className="mt-4">
          <summary className="cursor-pointer text-black font-bold">User Agent (click to expand)</summary>
          <pre className="text-xs text-black mt-2 whitespace-pre-wrap break-words">
            {info.userAgent}
          </pre>
        </details>
      </div>
      
      {/* Instructions */}
      <div className="mt-8 bg-yellow-100 p-6 rounded-lg border-2 border-yellow-400">
        <h2 className="text-2xl font-bold text-black mb-4">📋 What to Report:</h2>
        <ul className="space-y-2 text-black text-lg">
          <li>✅ Which boxes can you see?</li>
          <li>✅ Can you see the emojis (🏠📱⭐)?</li>
          <li>✅ Which responsive size shows (Mobile/Tablet/Desktop)?</li>
          <li>✅ What's your screen width shown above?</li>
          <li>✅ Does the gradient box look different from solid colors?</li>
        </ul>
      </div>
    </div>
  );
}
