# GStack 使用說明

本專案使用 [GStack](https://github.com/garrytan/gstack)（Y Combinator CEO Garry Tan 開源的 Claude Code skill 集合）。把 Claude Code 變成一個「虛擬新創團隊」，在產品開發的每個階段都能以對應角色視角（CEO / 設計師 / 工程經理 / QA / SRE / CSO）審視。

## 安裝（每位開發者第一次使用）

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

> 本 repo 已啟用 **team mode (required)**，沒裝 GStack 會被 PreToolUse hook 擋住所有 skill 呼叫。

## 完整指令一覽

### 1. 產品規劃（多角度思考）

| 指令 | 角色 | 功能 |
|------|------|------|
| `/office-hours` | YC Partner | 六問重新框架：demand reality、status quo、desperate specificity、narrowest wedge、observation、future-fit。另有 builder 模式做 side project 腦力激盪，會存成設計文件。 |
| `/plan-ceo-review` | CEO / 創辦人 | 挑戰 scope、追「10 星產品」。四種模式：SCOPE EXPANSION（大膽擴張）、SELECTIVE EXPANSION（守 scope 但挑重點擴）、HOLD SCOPE（最高嚴謹度）、SCOPE REDUCTION（砍到剩本質）。 |
| `/plan-design-review` | 設計師 | 對每個設計維度打 0–10 分，指出差距並改計畫（plan 階段用，不碰 code）。 |
| `/plan-eng-review` | 工程經理 | 架構、資料流、邊界案例、測試覆蓋、效能定稿。互動式給意見。 |
| `/plan-devex-review` | Staff Eng | DX 評分：開發者 persona、對手對標、magical moments、摩擦點。三種模式：DX EXPANSION / POLISH / TRIAGE。 |
| `/autoplan` | 自動審查 pipeline | 一次跑完 CEO + design + eng + DX 四個 review，最後集中在一個核准閘門呈現 taste 決策點。 |
| `/plan-tune` | 自調 | 調整 AskUserQuestion 敏感度與開發者心理偏好。 |

### 2. 設計

| 指令 | 功能 |
|------|------|
| `/design-consultation` | 從頭建立 design system：美學、字體、色彩、版面、留白、動效。產出 `DESIGN.md` 與字體/色彩預覽頁。 |
| `/design-shotgun` | 產多個 AI 設計變體、開對比板、收集結構化回饋並迭代。適合「我不喜歡現在的長相」。 |
| `/design-html` | 把核准的設計產成 production-ready 的 Pretext 原生 HTML/CSS（文字真的能 reflow、高度動態算）。 |
| `/design-review` | 視覺 QA：找出 spacing、視覺層級、AI slop、慢互動，直接改 code 並逐個 commit，前後截圖對照。 |

### 3. 開發 & 除錯

| 指令 | 功能 |
|------|------|
| `/investigate` | 系統化除錯，四階段：investigate → analyze → hypothesize → implement。鐵律：沒找到 root cause 不准下 fix。 |
| `/codex` | OpenAI Codex CLI 包裝。三種模式：review（獨立 pass/fail 閘門）、challenge（對抗模式，想辦法打破你的 code）、consult（可接續對話問任何問題）。 |
| `/checkpoint` | 存取工作狀態檢查點（git state + 決策 + 剩餘工作），跨 Conductor workspace 也能續接。 |
| `/learn` | 管理 GStack 跨 session 學到的東西：review、search、prune、export。 |

### 4. 測試 & 瀏覽器

| 指令 | 功能 |
|------|------|
| `/qa <url>` | 系統性 QA 測試+修 bug：跑測試、改 code、逐個 commit、重新驗證。 |
| `/qa-only <url>` | 只產 QA 報告（健康分數 + 截圖 + 重現步驟），不碰 code。 |
| `/browse` | 快速 headless 瀏覽器（~100ms/指令）：導頁、互動、截圖、diff、driving responsive layout。GStack 任何 web 瀏覽都建議走這個。 |
| `/open-gstack-browser` / `/connect-chrome` | 開出可視 Chromium（AI 控制，sidebar 即時活動），適合 debug。 |
| `/setup-browser-cookies` | 從本機 Chromium 匯入 cookies 進 headless session，用於測登入後畫面。 |
| `/benchmark` | 建立效能 baseline（LCP、Core Web Vitals、bundle size），PR 前後對比。 |
| `/health` | Code quality dashboard：整合 type checker、linter、test、dead code、shell lint，加權給 0–10 分並記趨勢。 |

### 5. 發布 & 部署

| 指令 | 功能 |
|------|------|
| `/review` | 預 land 的 PR review：SQL 安全、LLM trust boundary、conditional side effect、其他結構性問題。 |
| `/ship` | Ship 流程：detect + merge base、跑 test、review diff、bump VERSION、更新 CHANGELOG、commit、push、開 PR。 |
| `/land-and-deploy` | 接 `/ship` 之後：merge PR、等 CI 與部署、跑 canary 驗證 production 健康。 |
| `/canary` | Post-deploy 監控：console error、效能回歸、頁面壞掉，定期截圖與 baseline 對比。 |
| `/setup-deploy` | 一次設定好部署平台（Fly.io / Render / Vercel / Netlify / Heroku / GitHub Actions / custom）、prod URL、health endpoint，寫進 CLAUDE.md。 |
| `/document-release` | Post-ship 文件更新：對照 diff 自動更新 README / ARCHITECTURE / CONTRIBUTING / CLAUDE.md / CHANGELOG / TODOS，可順便 bump VERSION。 |

### 6. 安全與防呆

| 指令 | 功能 |
|------|------|
| `/cso` | 資安長模式。Infrastructure-first 審計：secrets、依賴供應鏈、CI/CD、LLM/AI 安全、OWASP Top 10、STRIDE，加主動驗證。兩種模式：daily（零雜訊）與 comprehensive（月度深掃）。 |
| `/careful` | 對 destructive command 先警告：`rm -rf`、`DROP TABLE`、force-push、`git reset --hard`、`kubectl delete` 等。可逐個 override。 |
| `/freeze <path>` | 把 Edit/Write 限制在指定資料夾，debug 時避免改到無關 code。 |
| `/unfreeze` | 解除 `/freeze`，恢復全目錄可寫。 |
| `/guard` | `careful + freeze` 合體，最高安全模式。 |

### 7. 團隊協作

| 指令 | 功能 |
|------|------|
| `/retro` | 每週工程回顧：commit 歷史、工作模式、code quality 指標，支援 per-person 貢獻分析。 |
| `/pair-agent` | 把其他 AI agent（OpenClaw、Hermes、Codex、Cursor…）接進你的瀏覽器分頁，遠端 agent 自有 scope。 |

### 8. 維運

| 指令 | 功能 |
|------|------|
| `/gstack-upgrade` | 升級 GStack，自動偵測 global vs vendored install。 |

## 推薦工作流

### 新功能（從點子到上線）

```
/office-hours            # 先確認問題是真的
    ↓
/plan-ceo-review         # 挑戰 scope
    ↓
/plan-design-review      # 從設計視角審
    ↓
/plan-eng-review         # 鎖架構 + 測試計畫
    ↓
  (實作)
    ↓
/review                  # PR 前靜態審查
    ↓
/qa <staging-url>        # 實際跑瀏覽器測
    ↓
/ship                    # 開 PR
    ↓
/land-and-deploy         # 合併 + 部署 + canary
    ↓
/document-release        # 更新文件
    ↓
/retro                   # 學到什麼
```

懶人版（一鍵）：`/autoplan` 一次跑完 CEO + design + eng + DX 四個 review。

### Debug bug

```
/investigate             # root cause analysis，不准跳過
    ↓
  (修)
    ↓
/review  →  /qa  →  /ship
```

### 產品探索 / 腦力激盪

```
/office-hours (builder mode)    # 發散
    ↓
/design-shotgun                 # 看 UI 變體
    ↓
/plan-ceo-review                # 收斂 scope
```

## 與 Nexbuy 工作流的衝突點

GStack 的 `/ship` 和 `/land-and-deploy` 預設會直接開 PR / merge / deploy。在本 repo 必須覆蓋：

1. **Worktree 流程優先**：新功能一律先 `git worktree add .worktrees/feat/<名稱> -b feat/<名稱>`
2. **PR base 是 `dev`**，不是 `main`
3. **不可直接 push `main` 或 `dev`**
4. **Commit 訊息格式**：conventional commits + `Co-authored-by: Claude <claude@anthropic.com>`
5. **.env 禁改**
6. **.NET 一律 `/usr/bin/dotnet`**，禁 `sudo dotnet`

若 GStack 預設與上列衝突，以 repo 規則為準。

## 常見問題

**Q：Playwright 在 WSL 跑不起來？**
A：裝系統依賴：`cd ~/.claude/skills/gstack && bunx playwright install-deps chromium`。

**Q：執行 skill 時被 check-gstack.sh 擋住？**
A：代表你的 `~/.claude/skills/gstack` 沒裝。照本檔開頭的安裝步驟即可。

**Q：想關掉 team mode？**
A：`cd ~/.claude/skills/gstack && ./setup --no-team`。但 repo 端的 `.claude/hooks/check-gstack.sh` 仍在，要完整解除需 revert 本 PR。

## 參考

- GStack GitHub：<https://github.com/garrytan/gstack>
- License：MIT
