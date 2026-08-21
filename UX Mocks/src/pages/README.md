# src/pages/

Pages and frames live here. Structure:

```
src/pages/
  <pageId>/
    page.json               ← manifest
    <frameId>.tsx           ← default-exports a component
```

Agents populate this directory. See AGENTS.md at the project root for the
frame contract.
