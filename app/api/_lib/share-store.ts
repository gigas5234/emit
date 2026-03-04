export type ShareSummaryPayload = {
  id: string;
  mentorId?: string;
  mentorNameKr: string;
  mentorNameEn: string;
  color1: string;
  color2: string;
  quote: string;
  emotionKeyword: string;
  healingScore: number;       // 0-100: how much lighter the person felt
  journeyWords: string[];     // 3-step emotional arc e.g. ["토로", "공감", "수용"]
  createdAt: number;
};

const shareStore = new Map<string, ShareSummaryPayload>();

export function setShareSummary(payload: ShareSummaryPayload) {
  shareStore.set(payload.id, payload);
}

export function getShareSummary(id: string) {
  return shareStore.get(id);
}

