import Link from "next/link";
import { CampaignForm } from "../CampaignForm";
import { createCampaignAction } from "../actions";

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/marketing"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← 行銷活動清單
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">新增活動</h1>
      </div>

      <CampaignForm
        initial={{ subject: "", body: "" }}
        action={createCampaignAction}
        submitLabel="建立草稿"
        cancelHref="/admin/marketing"
      />
    </div>
  );
}
