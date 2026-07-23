'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  /** スキャン成功時に呼ばれる（デコードされたテキスト） */
  onScan: (decodedText: string) => void;
  /** モーダルを閉じる */
  onClose: () => void;
  /** エラー時の追加ハンドラ（任意） */
  onError?: (error: Error) => void;
}

const ELEMENT_ID = 'qr-reader-container';

export default function QRScanner({ onScan, onClose, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false); // 二重発火防止
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const instance = new Html5Qrcode(ELEMENT_ID, { verbose: false });
        scannerRef.current = instance;

        await instance.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewWidth, viewHeight) => {
              const minEdge = Math.min(viewWidth, viewHeight);
              const size = Math.floor(minEdge * 0.75);
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(decodedText);
          },
          () => {
            // 毎フレームの失敗コールバック。ノイズなので無視。
          }
        );

        if (!cancelled) {
          setStatus('running');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('QRScanner start error:', error);
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(mapErrorToJapanese(error));
          onError?.(error);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const instance = scannerRef.current;
      if (instance) {
        // isScanning=true の時のみ stop() を呼ぶ
        const isScanning = instance.getState() === 2; // NOT_STARTED=1, SCANNING=2, PAUSED=3
        if (isScanning) {
          instance.stop().then(() => instance.clear()).catch(() => {
            // unmount 時のエラーは握り潰す（ユーザーに見せない）
          });
        } else {
          try {
            instance.clear();
          } catch {
            // 無視
          }
        }
        scannerRef.current = null;
      }
    };
  }, [onScan, onError]);

  return (
    <div className="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="md-dialog max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-primary text-on-primary p-4 flex items-center justify-between">
          <h2 className="md-title-large">QRコードをスキャン</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-primary text-2xl leading-none hover:opacity-80"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* カメラ領域 */}
        <div className="relative bg-black">
          <div id={ELEMENT_ID} className="w-full" />
          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm pointer-events-none">
              カメラを起動中…
            </div>
          )}
        </div>

        {/* ステータス / エラー */}
        <div className="p-4 text-center">
          {status === 'error' ? (
            <>
              <p className="text-error text-sm font-medium mb-2">
                カメラを起動できませんでした
              </p>
              {errorMessage && (
                <p className="text-on-surface-variant text-xs mb-3">{errorMessage}</p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outlined state-layer"
              >
                閉じる
              </button>
            </>
          ) : (
            <p className="text-on-surface-variant text-xs">
              対戦相手のQRコードをカメラに向けてください
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * html5-qrcode のエラーを日本語メッセージに変換する。
 * 代表的なのは NotAllowedError（権限拒否）、NotFoundError（カメラなし）、
 * NotReadableError（他アプリが使用中）。
 */
function mapErrorToJapanese(error: Error): string {
  const name = error.name || '';
  const msg = error.message || '';

  if (name === 'NotAllowedError' || /permission/i.test(msg)) {
    return 'カメラへのアクセスが拒否されました。ブラウザの設定から許可してください。';
  }
  if (name === 'NotFoundError' || /device/i.test(msg)) {
    return 'カメラが見つかりませんでした。';
  }
  if (name === 'NotReadableError' || /in use/i.test(msg)) {
    return '他のアプリケーションがカメラを使用中の可能性があります。';
  }
  if (/secure/i.test(msg) || /https/i.test(msg)) {
    return 'カメラ利用には HTTPS 接続が必要です。';
  }
  return msg || '不明なエラーが発生しました。';
}
