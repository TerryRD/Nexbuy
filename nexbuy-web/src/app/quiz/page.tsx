import type { Metadata } from "next";

export const metadata: Metadata = { title: "臉型測驗" };

export default function QuizPage() {
  return (
    <div className="container py-20 text-center">
      <p className="eyebrow mb-3">FACE SHAPE QUIZ</p>
      <h1 className="font-serif text-3xl font-medium">臉型測驗</h1>
      <p className="mt-4 text-muted-foreground">即將推出 — 找出最適合你的鏡框。</p>
    </div>
  );
}
