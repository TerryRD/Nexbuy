// 唯讀的驗光紀錄表格。admin 詳情頁與客戶 /account/prescriptions 共用。
// 操作（編輯 / 刪除）由 admin 端的 wrapper 自己加，這裡只管顯示。

import { formatDate } from "@/lib/format";

export interface PrescriptionRow {
  id: string;
  exam_date: string;
  right_sphere: number | null;
  right_cylinder: number | null;
  right_axis: number | null;
  right_add: number | null;
  left_sphere: number | null;
  left_cylinder: number | null;
  left_axis: number | null;
  left_add: number | null;
  pd: number | null;
  notes: string | null;
}

function formatDiopter(v: number | null): string {
  if (v === null) return "—";
  // ±0.00 格式（球面 / 散光），ADD 不加正負號慣例上其實也是正
  const sign = v > 0 ? "+" : v < 0 ? "" : "";
  return `${sign}${v.toFixed(2)}`;
}

function formatAxis(v: number | null): string {
  if (v === null) return "—";
  return `${v}°`;
}

export function PrescriptionsTable({
  rows,
  actions,
}: {
  rows: PrescriptionRow[];
  actions?: (row: PrescriptionRow) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        沒有驗光紀錄。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="overflow-x-auto rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-sm">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-medium">{formatDate(r.exam_date)}</span>
              {r.pd && (
                <span className="text-xs text-muted-foreground">
                  PD {r.pd} mm
                </span>
              )}
            </div>
            {actions && <div>{actions(r)}</div>}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">眼別</th>
                <th className="px-4 py-2 font-medium">球面 SPH</th>
                <th className="px-4 py-2 font-medium">散光 CYL</th>
                <th className="px-4 py-2 font-medium">軸度 AXIS</th>
                <th className="px-4 py-2 font-medium">加入度 ADD</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono text-xs">右 OD</td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.right_sphere)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.right_cylinder)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatAxis(r.right_axis)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.right_add)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono text-xs">左 OS</td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.left_sphere)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.left_cylinder)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatAxis(r.left_axis)}
                </td>
                <td className="px-4 py-2 font-mono">
                  {formatDiopter(r.left_add)}
                </td>
              </tr>
            </tbody>
          </table>

          {r.notes && (
            <p className="border-t bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
              備註：{r.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
