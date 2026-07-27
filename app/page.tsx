'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CompactPokemonCard from '@/components/ui/CompactPokemonCard';
import { sampleTeam } from '@/lib/sample-team';

type OtherTeamMode = 'closed' | 'url';

export default function Home() {
  const router = useRouter();
  const [otherTeamMode, setOtherTeamMode] = useState<OtherTeamMode>('closed');
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const routeFromUrl = (rawUrl: string): boolean => {
    try {
      const urlObj = new URL(rawUrl.trim());
      // 旧: 自己完結エンコード /view?data=（後方互換で残す）
      if (urlObj.pathname === '/view') {
        const data = urlObj.searchParams.get('data');
        if (data) {
          router.push(`/view?data=${encodeURIComponent(data)}`);
          return true;
        }
      }
      // 新: 短縮URL /view/<shortId>（nanoid: A-Za-z0-9_-）
      const shortIdMatch = urlObj.pathname.match(/^\/view\/([A-Za-z0-9_-]+)$/);
      if (shortIdMatch) {
        router.push(`/view/${shortIdMatch[1]}`);
        return true;
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

  const closeOtherTeam = () => {
    setOtherTeamMode('closed');
    setInputUrl('');
    setUrlError('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top app bar */}
      <div className="bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="md-title-large text-on-surface">
            第6世代（XY/ORAS）オープンチームシート対戦ツール
          </h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        {/* ヒーローセクション */}
        <div className="md-card p-4 sm:p-8 mb-8">
          <div className="text-center mb-6">
            <p className="md-body-large text-on-surface-variant">
              URLを送るだけで、お互いの手持ちを見せ合えます
            </p>
          </div>

          {/* メインCTA */}
          <div className="max-w-sm mx-auto">
            <button
              onClick={() => router.push('/builder')}
              className="state-layer bg-primary text-on-primary rounded-2xl py-6 px-6 w-full text-center"
            >
              <div className="md-title-medium">パーティを作成</div>
              <div className="md-body-medium opacity-90 mt-1">作成・編集</div>
            </button>
          </div>

          {/* サブ導線 */}
          <div className="flex justify-center items-center gap-6 mt-4">
            <button
              onClick={() => router.push('/my-teams')}
              className="md-body-medium text-primary hover:underline"
            >
              マイパーティ
            </button>
            <button
              onClick={() => {
                setOtherTeamMode('url');
                setUrlError('');
                setInputUrl('');
              }}
              className="md-body-medium text-primary hover:underline"
            >
              相手のパーティ
            </button>
          </div>

          {/* 相手のパーティ受信エリア */}
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
        </div>

        {/* サンプルパーティ */}
        <div className="md-card overflow-hidden mb-8">
          {/* ヘッダー */}
          <div className="bg-primary px-6 py-4">
            <h3 className="md-title-large text-on-primary text-center">
              サンプルパーティ
            </h3>
            <p className="text-center text-on-primary md-body-medium mt-1 opacity-90">
              共有すると相手にはこのように表示されます
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">1</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">パーティを作成</h4>
              <p className="md-body-medium text-on-surface-variant">
                ビルダーで自分のパーティを組む
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">2</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">URLを交換</h4>
              <p className="md-body-medium text-on-surface-variant">
                「共有URLを生成」で作ったURLを送り、相手のURLを受け取る
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-container rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-medium text-on-primary-container">3</span>
              </div>
              <h4 className="md-title-medium text-on-surface mb-2">対戦開始</h4>
              <p className="md-body-medium text-on-surface-variant">
                お互いの手持ちを確認して対戦
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
