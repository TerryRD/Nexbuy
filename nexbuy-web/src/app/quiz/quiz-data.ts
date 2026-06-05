import type { FaceShape } from "@/app/tryon/lib/face-recommendations";

export type QuizOption = {
  label: string;
  letter: string; // "A" | "B" | "C"
  svg: string; // key into FaceOptionIcon
  score: Partial<Record<FaceShape, number>>;
};
export type QuizQuestion = { id: string; question: string; options: QuizOption[] };

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "length",
    question: "你的臉長相對於臉寬，比較像？",
    options: [
      { label: "差不多 1:1", letter: "A", svg: "balanced", score: { 圓形: 2, 方形: 2 } },
      { label: "比例約 1.3:1", letter: "B", svg: "oval", score: { 橢圓: 2, 倒三角: 1 } },
      { label: "明顯偏長", letter: "C", svg: "long", score: { 橢圓: 3 } },
    ],
  },
  {
    id: "jaw",
    question: "下顎線條最接近？",
    options: [
      { label: "圓潤、無明顯角度", letter: "A", svg: "round_jaw", score: { 圓形: 2, 橢圓: 1 } },
      { label: "稍尖，下巴細", letter: "B", svg: "pointy_jaw", score: { 倒三角: 2, 橢圓: 1 } },
      { label: "明顯方正", letter: "C", svg: "square_jaw", score: { 方形: 3 } },
    ],
  },
  {
    id: "forehead",
    question: "額頭與下巴的寬度比較？",
    options: [
      { label: "額頭明顯較寬", letter: "A", svg: "wide_top", score: { 倒三角: 2 } },
      { label: "差不多寬", letter: "B", svg: "balanced_width", score: { 橢圓: 2, 方形: 1, 圓形: 1 } },
      { label: "下巴較寬", letter: "C", svg: "wide_bottom", score: { 方形: 1 } },
    ],
  },
  {
    id: "cheek",
    question: "從正面看，臉最寬的位置在？",
    options: [
      { label: "顴骨中央", letter: "A", svg: "cheeks", score: { 橢圓: 2, 倒三角: 1 } },
      { label: "下顎兩側", letter: "B", svg: "jaw_wide", score: { 方形: 2, 圓形: 1 } },
      { label: "整體偏窄、偏長", letter: "C", svg: "narrow", score: { 橢圓: 3 } },
    ],
  },
];

// answers[i] = chosen option index for question i
export function computeFaceShape(answers: number[]): FaceShape {
  const totals: Record<FaceShape, number> = { 圓形: 0, 方形: 0, 橢圓: 0, 倒三角: 0 };
  answers.forEach((optIdx, qIdx) => {
    const opt = QUIZ_QUESTIONS[qIdx]?.options[optIdx];
    if (!opt) return;
    for (const [shape, pts] of Object.entries(opt.score)) {
      totals[shape as FaceShape] += pts as number;
    }
  });
  // tie-break priority: 橢圓 > 圓形 > 方形 > 倒三角
  const order: FaceShape[] = ["橢圓", "圓形", "方形", "倒三角"];
  return order.reduce((best, s) => (totals[s] > totals[best] ? s : best), order[0]);
}

export const FACE_SHAPE_INFO: Record<FaceShape, { title: string; note: string }> = {
  圓形: { title: "圓形臉", note: "選擇有角度的框型（方框、雷朋），可拉長臉部線條、增加立體感。" },
  方形: { title: "方形臉", note: "圓潤的鏡框（圓框、橢圓）能柔和下顎的角度。" },
  橢圓: { title: "橢圓臉", note: "百搭臉型，幾乎任何框型都適合，依喜好挑選線條即可。" },
  倒三角: { title: "倒三角臉", note: "下半部較寬或圓潤的框型（貓眼、橢圓）能平衡額部與下巴比例。" },
};
