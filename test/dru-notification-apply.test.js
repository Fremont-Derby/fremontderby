
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the DRU apply list includes the notification policy migration", () => {
  const src = readFileSync(new URL("../scripts/apply-dru-migrations.mjs", import.meta.url), "utf8");
  assert.match(src, /20261003113000_dru_notification_no_browser_policy.sql/);
});
