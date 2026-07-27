import { Gender } from '@/types/pokemon';
import allPokemon from '@/data/all-pokemon.json';

// 第6世代（図鑑番号1〜721）のうち性別が固定される種族の一覧。
// PokeAPI の gender_rate（メスになる確率の8分率。-1 は性別なし）から抽出した。
// ここに載っていない種族はオス・メス両方が存在する。第6世代は種族が確定しているため更新は不要。

// 性別不明（メタモン・伝説・鋼系など）
const GENDERLESS_IDS = new Set([
  81, 82, 100, 101, 120, 121, 132, 137, 144, 145, 146, 150,
  151, 201, 233, 243, 244, 245, 249, 250, 251, 292, 337, 338,
  343, 344, 374, 375, 376, 377, 378, 379, 382, 383, 384, 385,
  386, 436, 437, 462, 474, 479, 480, 481, 482, 483, 484, 486,
  487, 489, 490, 491, 492, 493, 494, 599, 600, 601, 615, 622,
  623, 638, 639, 640, 643, 644, 646, 647, 648, 649, 703, 716,
  717, 718, 719, 720, 721,
]);

// オスのみ（ケンタロス・ランドロスなど）
const MALE_ONLY_IDS = new Set([
  32, 33, 34, 106, 107, 128, 236, 237, 313, 381, 414, 475,
  538, 539, 627, 628, 641, 642, 645,
]);

// メスのみ（ガルーラ・ラッキーなど）
const FEMALE_ONLY_IDS = new Set([
  29, 30, 31, 113, 115, 124, 238, 241, 242, 314, 380, 413,
  416, 440, 478, 488, 548, 549, 629, 630, 669, 670, 671,
]);

// ニャオニクスは♂(678)と♀(10025)でフォームが分かれているが、
// 種族単位では両性のため上記リストでは拾えない。個別に固定する。
const FORM_OVERRIDES = new Map<number, Gender[]>([
  [678, ['オス']],
  [10025, ['メス']],
]);

// フォーム違い（10000番台）から基本種族IDを引く。モジュール読込時に1回だけ構築する。
const baseSpeciesLookup = new Map<number, number>(
  (allPokemon as { id: number; formOf?: number; megaOf?: number }[])
    .filter((p) => p.formOf !== undefined || p.megaOf !== undefined)
    .map((p) => [p.id, (p.formOf ?? p.megaOf) as number])
);

/**
 * その種族で選べる性別を返す。
 * - 空配列 … 性別不明。性別を設定しない
 * - 1要素   … 単性。ユーザーに選ばせず自動で設定する
 * - 2要素   … 両性。ユーザーが選ぶ
 */
export function getGenderOptions(speciesId: number): Gender[] {
  const override = FORM_OVERRIDES.get(speciesId);
  if (override) return override;

  // フォーム違いは基本種族の性別を引き継ぐ（ランドロス れいじゅうフォルム等）
  const baseId = baseSpeciesLookup.get(speciesId) ?? speciesId;

  if (GENDERLESS_IDS.has(baseId)) return [];
  if (MALE_ONLY_IDS.has(baseId)) return ['オス'];
  if (FEMALE_ONLY_IDS.has(baseId)) return ['メス'];
  return ['オス', 'メス'];
}

/**
 * その種族として妥当な性別に解決する。
 * - 性別不明 … 常に undefined
 * - 単性     … 常にその性別（保存済みの値が違っていても矯正する）
 * - 両性     … current が妥当ならそのまま、なければ undefined（ユーザーが選ぶ）
 */
export function resolveGender(speciesId: number, current?: Gender): Gender | undefined {
  const options = getGenderOptions(speciesId);
  if (options.length === 0) return undefined;
  if (options.length === 1) return options[0];
  return current && options.includes(current) ? current : undefined;
}

/**
 * 種族を選んだ直後に自動設定される性別。
 * 単性ならその性別、性別不明・両性なら undefined（両性はユーザーが選ぶ）。
 */
export function getAutoGender(speciesId: number): Gender | undefined {
  return resolveGender(speciesId);
}
