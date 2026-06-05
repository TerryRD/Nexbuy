import {
  Truck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import type { ProductKind } from "@/lib/types/database";

interface GuaranteeCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FINISHED_CARDS: GuaranteeCard[] = [
  {
    icon: Truck,
    title: "免運到貨",
    description: "全台訂單免運費，2–3 個工作日到府",
  },
  {
    icon: RefreshCw,
    title: "七天鑑賞",
    description: "收到後七天內，無條件退換貨",
  },
  {
    icon: ShieldCheck,
    title: "一年保固",
    description: "鏡框材質及製造瑕疵，保固一年",
  },
  {
    icon: Sparkles,
    title: "終身服務",
    description: "免費調整鼻托與鏡腳，一輩子不打烊",
  },
];

const PRESCRIPTION_CARDS: GuaranteeCard[] = [
  {
    icon: CalendarDays,
    title: "預約驗光",
    description: "線上預約，專業驗光師到店服務",
  },
  {
    icon: Truck,
    title: "配鏡宅配",
    description: "配好的成鏡免費送到你指定地址",
  },
  {
    icon: ShieldCheck,
    title: "一年保固",
    description: "鏡框材質及製造瑕疵，保固一年",
  },
  {
    icon: Sparkles,
    title: "終身服務",
    description: "免費調整鼻托與鏡腳，一輩子不打烊",
  },
];

interface Props {
  kind: ProductKind;
}

export function PurchaseGuarantee({ kind }: Props) {
  const cards = kind === "finished" ? FINISHED_CARDS : PRESCRIPTION_CARDS;

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
          >
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {card.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
