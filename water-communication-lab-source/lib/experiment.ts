export const GROUPS = {
  A: {
    label: "A組｜氣象資訊",
    accent: "#2f7f9d",
    source: "區域氣象警報｜14:18 更新",
    headline: "未來一小時可能出現 60–90 mm 強降雨",
    detail: "警戒範圍涵蓋北河市東半部；預報格點無法直接判斷單一路段是否積水。",
  },
  B: {
    label: "B組｜社群現場",
    accent: "#d66f45",
    source: "地方社團貼文｜14:23 發布",
    headline: "東安地下道已經淹到輪胎一半",
    detail: "貼文附有照片與多則居民留言，但原始拍攝時間及位置尚未完成確認。",
  },
  C: {
    label: "C組｜監測數據",
    accent: "#5e8c62",
    source: "自動水位站｜14:16 資料",
    headline: "水位 1.42 m，十分鐘上升 0.18 m",
    detail: "測站距離東安地下道 3.2 公里，資料約延遲八分鐘，兩地排水系統不同。",
  },
  D: {
    label: "D組｜政府訊息",
    accent: "#7566a8",
    source: "市府災害應變訊息｜14:20 發布",
    headline: "目前尚無大規模淹水災情",
    detail: "局部通報仍在查證中；下一次統一更新預計於 14:40 發布。",
  },
} as const;

export type GroupCode = keyof typeof GROUPS;

export const CHOICES = [
  { id: "stay-home", label: "請全區居民暫停外出" },
  { id: "targeted-action", label: "請低窪區移車，避開地下道" },
  { id: "normal-travel", label: "目前無大規模災情，可正常通行" },
  { id: "wait", label: "暫不發布，等待資料一致" },
] as const;

export const PHASES = ["welcome", "round1", "reveal", "context", "round2", "results"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  welcome: "觀眾進場",
  round1: "第一次決策",
  reveal: "揭露資訊差異",
  context: "補上完整脈絡",
  round2: "再次決策",
  results: "結果與框架",
};

export const FULL_CONTEXT = [
  "強降雨帶集中在東側，未來四十分鐘仍可能持續。",
  "社群照片已確認為當日現場，但只代表一處低窪地下道。",
  "水位站持續上升，卻不能直接推估另一套排水系統的積水深度。",
  "市府訊息早於雨勢高峰；『無大規模災情』不等於沒有局部風險。",
];
