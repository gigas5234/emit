export type ShareSummaryPayload = {
  id: string;
  mentorNameKr: string;
  mentorNameEn: string;
  color1: string;
  color2: string;
  quote: string;
  emotionKeyword: string;
  summary: string;
  createdAt: number;
};

const shareStore = new Map<string, ShareSummaryPayload>();

export function setShareSummary(payload: ShareSummaryPayload) {
  shareStore.set(payload.id, payload);
}

export function getShareSummary(id: string) {
  return shareStore.get(id);
}

