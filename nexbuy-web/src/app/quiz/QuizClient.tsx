"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QUIZ_QUESTIONS, computeFaceShape, FACE_SHAPE_INFO } from "./quiz-data";
import { FaceOptionIcon } from "./FaceOptionIcon";
import {
  getRecommendedFrames,
  scoreProduct,
} from "@/app/tryon/lib/face-recommendations";
import { ProductCard } from "@/components/site/ProductCard";
import { Stepper } from "@/components/site/Stepper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProductForQuiz = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_urls: string[];
  kind: "finished" | "prescription_frame";
  finished_stock?: number | null;
  is_online_available?: boolean | null;
  face_shape?: readonly string[] | null;
  frame_shape?: string | null;
};

interface QuizClientProps {
  products: ProductForQuiz[];
  wishlistIds: string[];
  isLoggedIn: boolean;
}

export function QuizClient({ products, wishlistIds, isLoggedIn }: QuizClientProps) {
  const [answers, setAnswers] = useState<number[]>([]);

  const current = answers.length;
  const done = answers.length === QUIZ_QUESTIONS.length;

  // Persist face shape to localStorage on completion
  const shape = done ? computeFaceShape(answers) : null;
  useEffect(() => {
    if (done && shape) {
      localStorage.setItem("nb:faceShape", shape);
    }
  }, [done, shape]);

  function handleOption(optionIndex: number) {
    setAnswers((prev) => [...prev, optionIndex]);
  }

  function handleBack() {
    setAnswers((prev) => prev.slice(0, -1));
  }

  function handleReset() {
    setAnswers([]);
  }

  // ── Results view ──────────────────────────────────────────────────────────
  if (done && shape) {
    const info = FACE_SHAPE_INFO[shape];
    const recommendedFrames = getRecommendedFrames(shape);

    const toScoreArg = (p: ProductForQuiz) => ({
      face_shape: p.face_shape ? [...p.face_shape] : [],
      frame_shape: p.frame_shape ?? null,
    });

    const sortedProducts = [...products]
      .sort((a, b) => scoreProduct(toScoreArg(b), shape) - scoreProduct(toScoreArg(a), shape))
      .slice(0, 6);

    return (
      <section aria-label="臉型測驗結果" aria-live="polite">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">FACE SHAPE QUIZ</p>
          <h1 className="font-serif text-3xl font-medium md:text-4xl">
            你的臉型是{" "}
            <span className="text-primary">{info.title}</span>
          </h1>
          <p className="mt-4 max-w-prose mx-auto text-muted-foreground">{info.note}</p>
        </div>

        {/* Recommended frame shapes */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-foreground mb-3">推薦框型</p>
          <div className="flex flex-wrap justify-center gap-2">
            {recommendedFrames.map((frame) => (
              <span
                key={frame}
                className="rounded-full border border-primary bg-primary/10 px-4 py-1 text-sm font-medium text-primary"
              >
                {frame}
              </span>
            ))}
          </div>
        </div>

        {/* Product recommendations */}
        {sortedProducts.length > 0 && (
          <div className="mb-10">
            <h2 className="font-serif text-xl font-medium mb-5 text-center">推薦商品</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inWishlist={wishlistIds.includes(product.id)}
                  isLoggedIn={isLoggedIn}
                  priority={i < 2}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/tryon"
            className={cn(buttonVariants({ variant: "default", size: "lg" }))}
          >
            去虛擬試戴
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            重新測驗
          </button>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            逛全部鏡框
          </Link>
        </div>
      </section>
    );
  }

  // ── Quiz flow ─────────────────────────────────────────────────────────────
  const question = QUIZ_QUESTIONS[current];

  return (
    <section aria-label="臉型測驗">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="eyebrow mb-2">FACE SHAPE QUIZ</p>
        <h1 className="font-serif text-3xl font-medium">臉型測驗</h1>
      </div>

      {/* Progress */}
      <div className="mb-8 max-w-sm mx-auto">
        <Stepper
          steps={QUIZ_QUESTIONS.map((_, i) => `${i + 1}`)}
          current={current}
          label="測驗進度"
        />
        <p className="mt-3 text-center text-sm text-muted-foreground">
          第 {current + 1} / {QUIZ_QUESTIONS.length} 題
        </p>
      </div>

      {/* Question */}
      <div className="mb-6 text-center">
        <p className="text-lg font-medium text-foreground">{question.question}</p>
      </div>

      {/* Options grid */}
      <div
        className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto"
        role="group"
        aria-label={question.question}
      >
        {question.options.map((opt, i) => (
          <button
            key={opt.letter}
            type="button"
            aria-pressed={answers[current] === i}
            onClick={() => handleOption(i)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border p-5 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "hover:border-primary hover:bg-primary/5",
              "border-border bg-card",
            )}
          >
            <FaceOptionIcon svg={opt.svg} className="h-24 w-auto mx-auto text-foreground" />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shrink-0">
                {opt.letter}
              </span>
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Back button */}
      {current > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBack}
            className={cn(buttonVariants({ variant: "ghost", size: "default" }))}
          >
            ← 上一步
          </button>
        </div>
      )}
    </section>
  );
}
