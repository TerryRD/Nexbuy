import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/site/Logo";
import { LogoB } from "@/components/site/LogoB";
import { LogoC } from "@/components/site/LogoC";
import { LogoD } from "@/components/site/LogoD";

interface Variant {
  id: string;
  name: string;
  note: string;
  Component: ComponentType<SVGProps<SVGSVGElement>>;
}

const VARIANTS: readonly Variant[] = [
  {
    id: "A",
    name: "目前版本（圓角雙鏡片 + 鼻橋）",
    note: "現在線上的 logo — 安全、辨識度 OK，但偏 generic。",
    Component: Logo,
  },
  {
    id: "B",
    name: "不對稱單片眼",
    note: "左實心、右鏤空 — 一個被填滿、一個還在等被選擇。playful，記憶點高，跟眼鏡店「挑、選、配」的動作對得起來。",
    Component: LogoB,
  },
  {
    id: "C",
    name: "側面眼鏡 — 鏡片 + 鏡腳 + 耳鉤",
    note: "從側面看眼鏡，正在被戴上的瞬間。比正面對稱 logo 少見，動感最強。小尺寸要看細節線條保不保得住。",
    Component: LogoC,
  },
  {
    id: "D",
    name: "Horn-rim with brow bar（1950s 經典）",
    note: "粗 brow bar 橫過兩鏡片頂端、下半圓角 U 形 — Malcolm X / JFK 那種 browline 風。比現在的 A 版本有性格，但仍 quiet、不跳。",
    Component: LogoD,
  },
];

export default function LogoPreviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Logo 提案
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          四個方向：目前在線的 A，加上 B / C / D 三個替代。
          每個版本顯示三種尺寸 — header 用、中型獨立用、大型展示用。
          挑一個告訴我，會把它換進 header（之後也會用在 favicon / OG image）。
        </p>
      </div>

      <div className="space-y-16">
        {VARIANTS.map(({ id, name, note, Component }) => (
          <section key={id} className="space-y-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Option {id}
              </div>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                {name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {note}
              </p>
            </div>

            <div className="space-y-6 rounded-3xl border bg-card p-8">
              <Row label="Header（h-5 ≈ 20px）">
                <span className="flex items-center gap-2.5 font-heading text-xl font-semibold tracking-tight text-primary">
                  <Component className="h-5 w-auto" />
                  <span>精鋐眼鏡行</span>
                </span>
              </Row>
              <Row label="Medium（h-12 ≈ 48px）">
                <Component className="h-12 w-auto text-primary" />
              </Row>
              <Row label="Large（h-24 ≈ 96px）">
                <Component className="h-24 w-auto text-primary" />
              </Row>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
        <strong className="text-foreground">驗證 tip：</strong>{" "}
        每個版本都試著在 header 大小（最上面那行）盯久一點 — 那是它一輩子最常出現的尺寸。如果在那邊看起來糊或無聊，medium / large 再好看也沒用。
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-6 border-b pb-6 last:border-0 last:pb-0">
      <span className="w-32 shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
