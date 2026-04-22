---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Monitext'
  text: 'The Observability Ecosystem'
  tagline: A modular suite of monitoring and instrumentation tools for JS/TS
  actions:
    - theme: brand
      text: Explore Packages
      link: /nstack/latest/
    - theme: alt
      text: Guidelines
      link: /agent

features:
  - title: Multi-Engine Parsing
    details: Robust stack trace parsing across V8, Firefox, Bun, and Deno with nstack.
  - title: Event-Driven Architecture
    details: Scalable and decoupled messaging patterns for modern applications.
  - title: Modular Design
    details: Use only what you need. Each package is independently versioned and released.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
}
</style>
