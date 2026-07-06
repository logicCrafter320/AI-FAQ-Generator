---
name: Screenshot tool stale-paint ghosting
description: A blurred "ghost" text artifact under fixed/backdrop-blur navbars in app_preview screenshots that isn't a real app bug
---

The `screenshot` tool's headless browser session can leave a faint, blurred duplicate of heading text near the top of the viewport, overlapping a fixed navbar (especially one using `backdrop-blur`). It persists across repeated screenshots and across padding/CSS tweaks.

**Why:** Confirmed by changing the actual heading text content and re-screenshotting — the ghost text did not change, proving it isn't rendered from live DOM/CSS in that page. It's leftover paint from a previous page/route rendered in the same tab, not a real rendering bug.

**How to apply:** If a screenshot shows unexplained blurred/duplicated text near a fixed header that doesn't change when you edit the actual content or remove the blur/transform effects causing it, don't keep iterating on CSS — it's very likely a stale screenshot-tool artifact, not a real user-facing bug. Cross-check with curl/typecheck instead of chasing it visually.
