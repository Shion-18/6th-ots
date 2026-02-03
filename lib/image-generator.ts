import html2canvas from 'html2canvas';

/**
 * ファイル名をサニタイズ
 * 特殊文字を除去し、長さを50文字に制限
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

/**
 * DOM要素を画像として生成してダウンロード
 * @param element - 画像化するDOM要素
 * @param teamName - パーティ名（ファイル名に使用）
 */
export async function generateTeamImage(
  element: HTMLElement,
  teamName: string
): Promise<void> {
  try {
    // html2canvasで画像生成
    const canvas = await html2canvas(element, {
      allowTaint: true, // 外部画像読み込み許可
      logging: false, // コンソールログ抑制
      width: 1200,
      height: element.scrollHeight,
    } as any); // 型エラー回避

    // Canvasをblobに変換してダウンロード
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('画像の生成に失敗しました');
      }

      // ダウンロード実行
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${sanitizeFilename(teamName)}_${Date.now()}.png`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // メモリ解放
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('画像生成エラー:', error);
    throw new Error('画像の生成に失敗しました');
  }
}
