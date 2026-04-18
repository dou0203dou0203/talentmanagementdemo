import type { User } from '../types';

/**
 * トークナイザー（匿名化トランスレーター）
 *
 * AI へ送信するプロンプト内の個人名を UID に置換し、
 * AI から返ってきたレスポンス内の UID を本名に復元する。
 * これにより外部 AI に個人情報を一切渡さずに分析が可能。
 */

export interface TokenMap {
  nameToUid: Map<string, string>;
  uidToName: Map<string, string>;
}

/** users 配列からトークンマップを生成する */
export function buildTokenMap(users: User[]): TokenMap {
  const nameToUid = new Map<string, string>();
  const uidToName = new Map<string, string>();
  for (const u of users) {
    const shortId = u.id.slice(0, 8);
    nameToUid.set(u.name, `STAFF_${shortId}`);
    uidToName.set(`STAFF_${shortId}`, u.name);
  }
  return { nameToUid, uidToName };
}

/** プロンプト内のすべての個人名を UID トークンに置換する */
export function tokenizePrompt(text: string, map: TokenMap): string {
  let result = text;
  // 長い名前から先に置換（部分一致の衝突を避ける）
  const sorted = [...map.nameToUid.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [name, uid] of sorted) {
    result = result.replaceAll(name, uid);
  }
  return result;
}

/** AI レスポンス内のすべての UID トークンを本名に復元する */
export function detokenizeResponse(text: string, map: TokenMap): string {
  let result = text;
  for (const [uid, name] of map.uidToName.entries()) {
    result = result.replaceAll(uid, name);
  }
  return result;
}
