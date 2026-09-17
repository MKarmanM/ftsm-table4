import test from "node:test";
import assert from "node:assert/strict";
import { deriveMqfClusters } from "../lib/mqf-legend";

test("MQF clusters are derived deterministically from mapped PLO numbers", () => {
  assert.deepEqual(deriveMqfClusters([1, 2, 11]), ["C1", "C2", "C5"]);
});

test("MQF derivation removes duplicates and ignores unsupported PLO numbers", () => {
  assert.deepEqual(deriveMqfClusters([3, 3, 99]), ["C3A"]);
});
