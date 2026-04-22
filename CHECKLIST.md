# ✅ Pre-merge checklist (dev → main)

## 0. 🧠 Core idea

`dev` = integration / unstable
`main` = production / release-ready only

the merge is basically:

> “Is this version safe enough to ship?”

---

## 1. 🧪 Code health

- [ ] All tests pass (unit + integration)
- [ ] No failing CI checks
- [ ] Lint clean (no warnings you don’t intentionally ignore)
- [ ] Type-check passes (TS / build step)

---

## 2. 🔍 Functional sanity

- [ ] Core features manually tested
- [ ] Edge cases checked (null, empty, error paths)
- [ ] No “temporary debug code” left (console logs, mocks, etc.)
- [ ] No broken flows in critical paths

---

## 3. 📦 Build & runtime

- [ ] Project builds successfully in clean environment
- [ ] Production build works (not just dev mode)
- [ ] No missing env vars / secrets misconfig
- [ ] No runtime warnings in console

---

## 4. 🧩 Dependency sanity

- [ ] No accidental dependency bumps
- [ ] Lockfile is consistent
- [ ] No unused or experimental packages left in prod path

---

## 5. 🧠 Architecture check

- [ ] No breaking API changes without version bump
- [ ] Public interfaces stable
- [ ] Backward compatibility considered
- [ ] No leaking experimental abstractions into core layer

---

## 6. 📝 Git hygiene

- [ ] Branch is up to date with `main` (or rebased if needed)
- [ ] Clean commit history (squash if needed)
- [ ] Meaningful commit messages
- [ ] No WIP commits unless intentionally kept

---

## 7. 🚀 Release readiness

- [ ] Changelog updated (even minimal)
- [ ] Version bumped (if you version releases)
- [ ] Feature flags reviewed / removed if needed
