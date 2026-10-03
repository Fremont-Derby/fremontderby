import test from "node:test";
import assert from "node:assert/strict";
import { gammaPromotion, shipBlock } from "../src/shipBlock.js";

test("a missing contract blocks the pull request", () => {
  assert.match(shipBlock({ contract: false, checks: true }).text, /session contract/);
});

test("Gamma waits for the DRU screen", () => {
  assert.equal(gammaPromotion({ verified: false }).ok, false);
});
