import { describe, test, expect } from 'vitest';
import { getGenderOptions, getAutoGender } from '@/lib/gender';

describe('gender', () => {
  describe('getGenderOptions', () => {
    test('性別不明の種族は空配列を返す', () => {
      expect(getGenderOptions(132)).toEqual([]); // メタモン
      expect(getGenderOptions(639)).toEqual([]); // テラキオン
      expect(getGenderOptions(81)).toEqual([]); // コイル
    });

    test('オスのみの種族はオスだけを返す', () => {
      expect(getGenderOptions(128)).toEqual(['オス']); // ケンタロス
      expect(getGenderOptions(645)).toEqual(['オス']); // ランドロス
      expect(getGenderOptions(32)).toEqual(['オス']); // ニドラン♂
    });

    test('メスのみの種族はメスだけを返す', () => {
      expect(getGenderOptions(115)).toEqual(['メス']); // ガルーラ
      expect(getGenderOptions(113)).toEqual(['メス']); // ラッキー
      expect(getGenderOptions(29)).toEqual(['メス']); // ニドラン♀
    });

    test('両性の種族はオスとメスを返す', () => {
      expect(getGenderOptions(25)).toEqual(['オス', 'メス']); // ピカチュウ
      expect(getGenderOptions(6)).toEqual(['オス', 'メス']); // リザードン
      expect(getGenderOptions(681)).toEqual(['オス', 'メス']); // ギルガルド
    });

    test('フォーム違いは基本種族の性別を引き継ぐ', () => {
      expect(getGenderOptions(10021)).toEqual(['オス']); // ランドロス(れいじゅうフォルム)
      expect(getGenderOptions(10004)).toEqual(['メス']); // ミノマダム(すなちのミノ)
      expect(getGenderOptions(10008)).toEqual([]); // ヒートロトム
    });

    test('ニャオニクスは♂♀のフォームごとに性別が固定される', () => {
      expect(getGenderOptions(678)).toEqual(['オス']);
      expect(getGenderOptions(10025)).toEqual(['メス']);
    });

    test('未知のIDは両性として扱う', () => {
      expect(getGenderOptions(99999)).toEqual(['オス', 'メス']);
    });
  });

  describe('getAutoGender', () => {
    test('単性の種族は性別が自動で決まる', () => {
      expect(getAutoGender(128)).toBe('オス'); // ケンタロス
      expect(getAutoGender(115)).toBe('メス'); // ガルーラ
      expect(getAutoGender(10021)).toBe('オス'); // ランドロス(れいじゅうフォルム)
    });

    test('性別不明と両性はundefinedを返す', () => {
      expect(getAutoGender(132)).toBeUndefined(); // メタモン
      expect(getAutoGender(25)).toBeUndefined(); // ピカチュウ
    });
  });
});
