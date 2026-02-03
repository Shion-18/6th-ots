'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  url: string;
  teamName: string;
  size?: number;
  onClose: () => void;
}

export default function QRCodeDisplay({ url, teamName, size = 256, onClose }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${teamName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}_qr.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">QRコード</h2>
            <p className="text-sm text-gray-600 mt-1">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
          <QRCodeSVG
            id="qr-code-svg"
            value={url}
            size={size}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* URL Display */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">共有URL</label>
          <div className="bg-gray-100 rounded-lg p-3 break-all text-xs text-gray-700">
            {url}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {copied ? 'コピー完了!' : 'URLをコピー'}
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            QRダウンロード
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          QRコードをスキャンして、パーティ情報を表示
        </p>
      </div>
    </div>
  );
}
