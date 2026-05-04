// 簡易 CSV parser（pure function、零依賴）。
// 規則：
// - 欄位以逗號分隔
// - 雙引號包裹的欄位：可內含逗號 / 換行；連續兩個 "" 表示一個 " 字元
// - 行分隔支援 CRLF / LF / CR
// - 第一行視為 header
// - 回傳 { headers: string[], rows: Record<string, string>[] }
//
// MVP 限制：不支援 BOM 以外的奇怪字元；如果 admin 用 Excel 存出 UTF-8 BOM
// 開頭，這裡 strip 掉。

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, ""); // strip BOM
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === '"' && cell === "") {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      // 忽略 CRLF 的 LF
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      records.push(row);
      row = [];
      i++;
      continue;
    }

    cell += ch;
    i++;
  }

  // 收尾
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    records.push(row);
  }

  // 過濾整列空白（trailing newline 造成的空 row）
  const cleaned = records.filter(
    (r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""),
  );
  if (cleaned.length === 0) return { headers: [], rows: [] };

  const headers = cleaned[0].map((h) => h.trim());
  const rows = cleaned.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows };
}
