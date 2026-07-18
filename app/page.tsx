'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CompactPokemonCard from '@/components/ui/CompactPokemonCard';
import { sampleTeam } from '@/lib/sample-team';

// カメラ API はクライアント専用なので SSR を無効化して lazy-load
const QRScanner = dynamic(() => import('@/components/ui/QRScanner'), {
  ssr: false,
});

type OtherTeamMode = 'closed' | 'choose' | 'url' | 'qr';

export default function Home() {
  const router = useRouter();
  const [otherTeamMode, setOtherTeamMode] = useState<OtherTeamMode>('closed');
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [scanError, setScanError] = useState('');

  const routeFromUrl = (rawUrl: string): boolean => {
    try {
      const urlObj = new URL(rawUrl.trim());
      if (urlObj.pathname === '/view') {
        const data = urlObj.searchParams.get('data');
        if (data) {
          router.push(`/view?data=${encodeURIComponent(data)}`);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.trim()) return;
    if (!routeFromUrl(inputUrl)) {
      setUrlError('正しいURLを入力してください');
    }
  };

  const handleQRScan = (decodedText: string) => {
    if (routeFromUrl(decodedText)) {
      setOtherTeamMode('closed');
      setScanError('');
    } else {
      setScanError('このQRコードは対応していません。共有URLを読み取ってください。');
      setOtherTeamMode('choose');
    }
  };

  const closeOtherTeam = () => {
    setOtherTeamMode('closed');
    setInputUrl('');
    setUrlError('');
    setScanError('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top app bar */}
      <div className="bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="md-headline-small text-on-surface">
            オープンチームシート
          </h1>
          <p className="md-body-medium text-on-surface-variant mt-1">第6世代ポケモン対戦用</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        {/* ヒーローセクション */}
        <div className="md-card p-4 sm:p-8 mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-normal text-on-surface mb-4">
              パーティを共有して<br />対戦を始めよう
            </h2>
            <p className="md-body-large text-on-surface-variant">
              オープンチームシートルールで、スムーズに対戦開始
            </p>
          </div>

          {/* アクションタイル */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <button
              onClick={() => router.push('/builder')}
              className="state-layer bg-primary text-on-primary rounded-2xl py-6 px-6 text-left"
            >
              <div className="md-title-medium">パーティを作成</div>
              <div className="md-body-medium opacity-90 mt-1">作成・編集</div>
            </button>

            <button
              onClick={() => router.push('/my-teams')}
              className="state-layer bg-surface-container-high text-on-surface rounded-2xl py-6 px-6 text-left"
            >
              <div className="md-title-medium">マイパーティ</div>
              <div className="md-body-medium text-on-surface-variant mt-1">保存済み</div>
            </button>

            <button
              onClick={() => {
                setOtherTeamMode('choose');
                setUrlError('');
                setScanError('');
                setInputUrl('');
              }}
              className="state-layer bg-surface-container-high text-on-surface rounded-2xl py-6 px-6 text-left"
            >
              <div className="md-title-medium">相手のパーティ</div>
              <div className="md-body-medium text-on-surface-variant mt-1">QR / URL</div>
            </button>
          </div>

          {/* 相手のパーティ受信エリア */}
          {otherTeamMode === 'choose' && (
            <div className="mt-6 bg-surface-container rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="md-title-medium text-on-surface">
                  受け取り方法を選んでください
                </p>
                <button
                  onClick={closeOtherTeam}
                  className="text-on-surface-variant hover:text-on-surface text-lg leading-none"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              {scanError && (
                <p className="text-error md-body-medium mb-3">{scanError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setOtherTeamMode('qr')}
                  className="btn btn-filled state-layer"
                >
                  QRコードをスキャン
                </button>
                <button
                  onClick={() => {
                    setOtherTeamMode('url');
                    setUrlError('');
                  }}
                  className="btn btn-outlined state-layer"
                >
                  URLを入力
                </button>
              </div>
            </div>
          )}

          {otherTeamMode === 'url' && (
            <div className="mt-6 bg-surface-container rounded-xl p-4">
              <label className="block md-title-medium text-on-surface mb-2">
                相手から受け取ったURLを貼り付け
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => { setInputUrl(e.target.value); setUrlError(''); }}
                  placeholder="https://..."
                  className="text-field flex-1 min-w-0 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  onClick={handleUrlSubmit}
                  className="btn btn-filled state-layer"
                >
                  表示
                </button>
                <button
                  onClick={closeOtherTeam}
                  className="text-on-surface-variant hover:text-on-surface px-2 text-lg"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              {urlError && (
                <p className="text-error md-body-medium mt-2">{urlError}</p>
              )}
            </div>
          )}

          {otherTeamMode === 'qr' && (
            <QRScanner
              onScan={handleQRScan}
              onClose={() => setOtherTeamMode('choose')}
            />
          )}
        </div>

        {/* サンプルパーティ */}
        <div className="md-card overflow-hidden mb-8">
          {/* ヘッダー */}
          <div className="bg-primary px-6 py-4">
            <h3 className="md-title-large text-on-primary text-center">
              サンプルパーティ
            </h3>
            <p className="text-center text-on-primary md-body-medium mt-1 opacity-90">
              このような形でパーティが表示されます
            </p>
          </div>

          {/* パーティリスト */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {sampleTeam.pokemon.map((pokemon) => (
                <CompactPokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>

            {/* アクションボタン */}
            <div className="text-center">
              <button
                onClick={() => router.push('/builder')}
                className="btn btn-filled state-layer"
              >
                自分のパーティを作成する
              </button>
            </div>
          </div>
        </div>

        {/* 使い方 */}
        <div className="md-card p-4 sm:p-8 mb-8">
          <h3 className="md-title-large text-on-surface mb-6 text-center">使い方</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">1</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">パーティ作成</h4>
              <p className="md-body-medium text-on-surface-variant">
                ビルダーで自分のパーティを作成
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">2</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">QR/URL共有</h4>
              <p className="md-body-medium text-on-surface-variant">
                生成されたQRコードまたはURLを対戦相手に共有
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">3</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">相手のパーティ確認</h4>
              <p className="md-body-medium text-on-surface-variant">
                QRをスキャンするかURLを開く
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">4</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">対戦開始</h4>
              <p className="md-body-medium text-on-surface-variant">
                お互いのパーティを把握して対戦
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center mt-8 text-on-surface-variant md-body-medium">
          <p>第6世代（XY/ORAS）オープンチームシート対戦ツール</p>
        </div>
      </div>
    </div>
  );
}
