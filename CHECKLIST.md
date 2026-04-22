# ✅ Pre-merge checklist (dev → main)

## 0. 🧠 Core idea

`dev` = integration / unstable
`main` = production / release-ready only

the merge is basically:

> “Is this version safe enough to ship?”

---

## 1. 🧪 Code health

- [x] All tests pass (unit + integration)
- [x] No failing CI checks
- [x] Lint clean (no warnings you don’t intentionally ignore)
- [x] Type-check passes (TS / build step)

---

## 2. 🔍 Functional sanity

- [x] Core features manually tested
- [x] Edge cases checked (null, empty, error paths)
- [x] No “temporary debug code” left (console logs, mocks, etc.)
- [x] No broken flows in critical paths

---

## 3. 📦 Build & runtime

- [x] Project builds successfully in clean environment
- [x] Production build works (not just dev mode)
- [x] No missing env vars / secrets misconfig
- [x] No runtime warnings in console

---

## 4. 🧩 Dependency sanity

- [x] No accidental dependency bumps
- [x] Lockfile is consistent
- [x] No unused or experimental packages left in prod path

---

## 5. 🧠 Architecture check

- [x] No breaking API changes without version bump
- [x] Public interfaces stable
- [x] Backward compatibility considered
- [x] No leaking experimental abstractions into core layer

---

## 6. 📝 Git hygiene

- [x] Branch is up to date with `main` (or rebased if needed)
- [x] Clean commit history (squash if needed)
- [x] Meaningful commit messages
- [x] No WIP commits unless intentionally kept

---

## 7. 🚀 Release readiness

- [x] Changelog updated (even minimal)
- [x] Version bumped (if you version releases)
- [x] Feature flags reviewed / removed if needed
