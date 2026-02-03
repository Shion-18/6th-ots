import { useRef, useState } from 'react';
import { generateTeamImage } from '@/lib/image-generator';
import { Team } from '@/types/pokemon';

/**
 * 画像生成のカスタムフック
 * @param team - パーティデータ
 * @returns 画像生成に必要な状態と関数
 */
export function useImageGenerator(team: Team | null) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!team) {
      setError('パーティデータがありません');
      alert('パーティデータがありません');
      return;
    }

    if (!imageRef.current) {
      setError('画像生成の準備ができていません');
      alert('画像生成の準備ができていません');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await generateTeamImage(imageRef.current, team.name);
      alert('画像をダウンロードしました！');
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の生成に失敗しました';
      setError(message);
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    imageRef,
    isGenerating,
    error,
    generateImage,
  };
}
