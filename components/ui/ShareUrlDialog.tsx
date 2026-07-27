'use client';

import { useState, useSyncExternalStore } from 'react';
import { copyToClipboard } from '@/lib/clipboard';

interface ShareUrlDialogProps {
  url: string;
  teamName: string;
  onClose: () => void;
}

// Web Share API の有無はクライアントでしか判定できない。
// サーバー側スナップショットを false に固定してハイドレーション不一致を避ける。
const subscribeNoop = () => () => {};
const getCanShare = () => typeof navigator.share === 'function';
const getCanShareServer = () => false;

export default function ShareUrlDialog({ url, teamName, onClose }: ShareUrlDialogProps) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(subscribeNoop, getCanShare, getCanShareServer);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: teamName,
        text: `${teamName} のパーティ`,
        url,
      });
    } catch (error) {
      // 共有シートを閉じただけの場合は何もしない
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('ネイティブ共有に失敗:', error);
      await handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-scrim/32 flex items-center justify-center z-50 p-4">
      <div className="md-dialog max-w-md w-full p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="md-headline-small text-on-surface">共有URL</h2>
            <p className="md-body-medium text-on-surface-variant mt-1">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl font-bold leading-none"
          >
            ×
          </button>
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
        <div className={canShare ? 'grid grid-cols-2 gap-3' : 'flex'}>
          {canShare && (
            <button
              onClick={handleNativeShare}
              className="btn btn-filled state-layer"
            >
              共有
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`btn state-layer ${canShare ? 'btn-outlined' : 'btn-filled w-full'}`}
          >
            {copied ? 'コピー完了!' : 'URLをコピー'}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-on-surface-variant text-center mt-4">
          対戦相手にこのURLを送ってください
        </p>
      </div>
    </div>
  );
}
