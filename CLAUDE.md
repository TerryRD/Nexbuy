# Nexbuy — Claude Code 專案指引

B2C 電子商務平台（Vue 3 + .NET 8 Web API + SQL Server / Supabase migration）。

## GStack 工作流程（用於產品多角度思考）

本專案已安裝 GStack（Garry Tan / YC 的 Claude Code skill 集合）於 `~/.claude/skills/gstack`。
設計上用來在動手寫程式前，強迫從不同角色視角檢視產品決策。

完整指令參考見 [`docs/gstack-guide.md`](docs/gstack-guide.md)。

**產品思考 — 建議起手式**：`/office-hours` → `/plan-ceo-review` → `/plan-design-review` → `/plan-eng-review` → 實作 → `/review` → `/qa`。

最常用指令：`/office-hours`（六問重框架）、`/plan-ceo-review`（挑戰 scope）、`/review`（PR review）、`/qa`（實際跑瀏覽器測試）、`/investigate`（除錯前先研究）。

## 工作流程限制（覆蓋 GStack 預設行為）

使用者的全域 CLAUDE.md 規則優先，GStack 的 `/ship`、`/land-and-deploy` 需配合以下調整：

1. **Worktree 流程**：所有開發一律在 `.worktrees/feat/<功能名>` 進行，先 `git worktree add`
2. **PR 目標分支**：一律發到 `dev`，禁止直接 push `main` / `dev`
3. **Commit 格式**：conventional commits + `Co-authored-by: Claude <claude@anthropic.com>`
4. **.NET 指令**：使用 `/usr/bin/dotnet`，禁止 `sudo dotnet`
5. **禁改 `.env`**

若 GStack 指令的預設動作與上列衝突，以上列為準。

## 專案結構

- `nexbuy-frontend/` — Vue 3 前端
- `nexbuy-supabase/` — Supabase + Vercel 遷移專案
- `spec/` — 規格文件
- `Nexbuy.slnx` — .NET solution

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).
