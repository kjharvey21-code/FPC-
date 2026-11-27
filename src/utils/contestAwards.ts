import { ContestAward } from '../types';

export const createDefaultContestAwards = (): ContestAward[] => [
  { id: `award_${Date.now()}_1`, award: '1st Place', pks: 40 },
  { id: `award_${Date.now()}_2`, award: '2nd Place', pks: 25 },
];

export function formatContestPrizeSummary(awards: ContestAward[]): string {
  return awards
    .filter((a) => a.award.trim().length > 0)
    .map((a) => `${a.award.trim()}: +${Math.max(0, Number(a.pks) || 0)} PKS`)
    .join(' · ');
}

export function parseLegacyContestPrize(prizeStr?: string): ContestAward[] {
  if (!prizeStr || !prizeStr.trim()) {
    return [];
  }

  const parts = prizeStr
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part, index) => {
    const pksMatch = part.match(/\+?(\d+)\s*PKS/i);
    const pks = pksMatch ? parseInt(pksMatch[1], 10) : 0;
    const cleanedAward = part
      .replace(/:\s*\+?\d+\s*PKS.*$/i, '')
      .replace(/\(\s*[A-Z]\d+\s*\)/gi, '')
      .replace(/\+?\d+\s*PKS/gi, '')
      .replace(/[:\-–]+$/, '')
      .trim();

    return {
      id: `award_legacy_${Date.now()}_${index}`,
      award: cleanedAward || part,
      pks,
    };
  });
}
