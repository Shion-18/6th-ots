'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';

interface QRCodeDisplayProps {
  url: string;
  teamName: string;
  size?: number;
  onClose: () => void;
}

export default function QRCodeDisplay({ url, teamName, size = 256, onClose }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${teamName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}_qr.png`;
          link.click();
          URL.revokeObjectURL(blobUrl);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-scrim/32 flex items-center justify-center z-50 p-4">
      <div className="md-dialog max-w-md w-full p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="md-headline-small text-on-surface">QRコード</h2>
            <p className="md-body-medium text-on-surface-variant mt-1">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* QR Code — レスポンシブ */}
        <div className="flex justify-center mb-4">
          <div className="w-full max-w-[256px]">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={size}
              level="M"
              includeMargin={true}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* URL Display — タップで全選択 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-on-surface-variant mb-1">共有URL</label>
          <input
            type="url"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="w-full bg-surface-container-highest rounded p-3 text-xs text-on-surface-variant outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="btn btn-filled state-layer"
          >
            {copied ? 'コピー完了!' : 'URLをコピー'}
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-outlined state-layer"
          >
            QRダウンロード
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-on-surface-variant text-center mt-4">
          対戦相手にスキャンしてもらってください
        </p>
      </div>
    </div>
  );
}
