# QA Report: Browser Verification Stop Root Cause

作成日: 2026-05-09

## 対象

`mission-20260509-browser-verification-stop`

## 読んだもの

- `docs/product/dev.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/missions/mission-20260509-browser-verification-stop/mission.md`
- `package.json`
- `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`

## 実行環境メモ

- OS shell: PowerShell
- Next.js: `16.2.1`
- dev script: `next dev`
- Next.js 16 behavior: `next dev` uses Turbopack by default and is a long-running development server.
- existing dev server: PID `24952`, `node.exe`, started `2026/05/09 15:46:52`, serving this repo on `http://localhost:3000`

## 再現コマンドと観測結果

### 1. `npx` startup probe

Command:

```powershell
npx next dev --port 3210 --hostname 127.0.0.1
```

Result:

- exit code: `1`
- stop position: before Next.js startup
- observed error: PowerShell blocked `C:\Program Files\nodejs\npx.ps1` because script execution is disabled.

Classification:

- local environment 起因
- not repo / app code 起因

### 2. direct Next CLI startup probe

Command:

```powershell
node node_modules\next\dist\bin\next dev --port 3210 --hostname 127.0.0.1
```

Result:

- exit code: `1`
- observed startup:
  - `Next.js 16.2.1 (Turbopack)`
  - `Local: http://127.0.0.1:3210`
  - `Ready in 636ms`
- stop position: after startup, at Next.js repo lock check
- observed stop reason: `Another next dev server is already running.`
- existing server:
  - local URL: `http://localhost:3000`
  - PID: `24952`
  - dir: `C:\Users\toyos\projects\bloomlog-expo`
  - log: `.next\dev\logs\next-development.log`

Classification:

- long-running process handling 起因
- local environment 起因
- not repo / app code 起因

### 3. HTTP smoke against existing server

Command:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/ -TimeoutSec 10
```

Result:

- status: `200 OK`
- response: HTML document with `lang="ja"`

Classification:

- app is reachable through local dev server
- no network/service dependency failure observed for the non-authenticated root smoke

### 4. Codex in-app browser smoke

Command shape:

```js
if (!globalThis.agent) {
  const { setupAtlasRuntime } = await import("C:/Users/toyos/.codex/plugins/cache/openai-bundled/browser-use/0.1.0-alpha2/scripts/browser-client.mjs");
  await setupAtlasRuntime({ globals: globalThis });
}
if (!globalThis.browser) {
  globalThis.browser = await agent.browsers.get("iab");
}
await browser.nameSession("Bloomlog browser verification");
if (typeof tab === "undefined") {
  globalThis.tab = await browser.tabs.new();
}
await tab.goto("http://localhost:3000/");
await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 10000 });
const title = await tab.title();
const url = await tab.url();
const snapshot = await tab.playwright.domSnapshot();
const logs = await tab.dev.logs({ levels: ["error", "warn"], limit: 20 });
```

Observed:

- title: `BloomLog`
- final URL: `http://localhost:3000/login`
- DOM snapshot contained:
  - `BloomLog`
  - `Googleでログイン`
  - `BloomLog は万博の体験を記録するアプリです。現在は Google ログインのみ対応しています。`
  - `Googleでログイン` button
- browser console error/warn logs: `[]`

Classification:

- browser automation tooling 起因: not reproduced
- auth / OAuth / session 起因: expected redirect to login for unauthenticated browser
- repo / app code 起因: not indicated

## Root Cause

今回確認できた root cause は、ブラウザ automation 自体の停止ではなく、検証前提の混線である。

1. PowerShell で `npx` を使うと execution policy で止まる。
2. `next dev` は long-running process であり、既存 dev server がある状態で別ポート起動を試すと Next.js の lock で止まる。
3. 未ログイン browser では `/` が `/login` に遷移するため、authenticated photo upload smoke まで進めない。

## Bounded Verification Command

次回の AI Agent は、まず `npx` を避け、既存 server を確認してから browser smoke を行う。

Recommended local sequence:

```powershell
git status --short --branch
node node_modules\next\dist\bin\next dev --port 3210 --hostname 127.0.0.1
```

If the command reports an existing dev server for the same repo, do not start another server. Verify the reported URL instead:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/ -TimeoutSec 10
Get-Content -Encoding UTF8 -LiteralPath .next\dev\logs\next-development.log -Tail 120
```

Then run Codex in-app browser with a bounded `domcontentloaded` wait:

```js
await tab.goto("http://localhost:3000/");
await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 10000 });
const url = await tab.url();
const snapshot = await tab.playwright.domSnapshot();
const logs = await tab.dev.logs({ levels: ["error", "warn"], limit: 20 });
```

Pass condition for unauthenticated smoke:

- HTTP status is `200`.
- Browser reaches `/login` or the expected public route.
- DOM snapshot is captured.
- browser console has no relevant error logs.

Do not classify unauthenticated `/login` redirect as browser failure.

## 残リスク

Authenticated photo upload smoke is not verified by this Mission.

Reason:

- No authenticated browser session or approved test credential was available in this execution environment.
- Google OAuth flow should not be treated as a generic automated smoke unless a test account/session is explicitly available and approved.

Handling:

- Keep authenticated app smoke as residual risk / follow-up condition.
- Do not block docs-only or read-only Missions solely because authenticated browser state is unavailable.

## QA 判定

Pass for this Mission's purpose.

The stop reason is classified enough to update the Mission to `completed` with residual risk separated.
