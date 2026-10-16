import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  defaultTariffs,
  estimatePrice,
  validateTariffs,
} from "../src/pricing.js";
import { validateStep } from "../src/data.js";

const form = {
  service: "general",
  area: "65",
  property: "apartment",
  rooms: "2",
  extras: [],
};
test("rates depend on cleaning type; minimum applies before extras", () => {
  for (const [service, total] of [
    ["general", 7150],
    ["regular", 4225],
    ["office", 3575],
    ["renovation", 9750],
  ])
    assert.equal(estimatePrice({ ...form, service }).total, total);
  const quote = estimatePrice({
    ...form,
    area: "10",
    extras: ["Мытьё окон", "Балкон / лоджия"],
    extraQuantities: { windows: "3", balcony: "4" },
  });
  assert.equal(quote.total, 7900);
  assert.equal(quote.minimumApplied, true);
  assert.equal(quote.areaAmount, 1100);
  assert.deepEqual(
    quote.extras.map((row) => row.amount),
    [1500, 1400],
  );
});
test("invalid area and selected quantities cannot produce a misleading price", () => {
  for (const area of ["", "bad", "9", "5001", Infinity])
    assert.equal(estimatePrice({ ...form, area }), null);
  for (const windows of ["", "0", "-1", "1.5", "101", "bad"]) {
    const invalid = {
      ...form,
      extras: ["Мытьё окон"],
      extraQuantities: { windows },
    };
    assert.equal(estimatePrice(invalid), null);
    assert.ok(validateStep(0, invalid).extras);
  }
  assert.ok(estimatePrice({ ...form, extraQuantities: { windows: "" } }));
});
test("tariff validation rejects partial, negative, non-finite or fractional settings", () => {
  assert.throws(() => validateTariffs({}));
  for (const rate of ["110", "", NaN, Infinity, 0, -1, 1.5, 100001]) {
    const invalid = structuredClone(defaultTariffs);
    invalid.services.general.rate = rate;
    assert.throws(() => validateTariffs(invalid));
  }
  const invalid = structuredClone(defaultTariffs);
  invalid.extras.windows = -1;
  assert.throws(() => validateTariffs(invalid));
  assert.doesNotThrow(() => validateTariffs(defaultTariffs));
});
test("saved tariffs change new quotes; old snapshots survive edits and restore", async () => {
  globalThis.indexedDB = indexedDB;
  globalThis.window = new EventTarget();
  globalThis.BroadcastChannel = undefined;
  const {
    getTariffs,
    saveTariffs,
    createOrder,
    getOrders,
    deleteOrder,
    restoreOrder,
  } = await import("../src/db.js");
  const orderForm = { ...form, name: "Тест", address: "Примерный адрес" };
  const original = await createOrder(orderForm);
  const custom = structuredClone(defaultTariffs);
  custom.services.general.rate = 200;
  const saved = await saveTariffs(custom);
  assert.equal(saved.revision, 2);
  assert.equal((await getTariffs()).services.general.rate, 200);
  const newer = await createOrder(orderForm);
  assert.equal(newer.quote.total, 13000);
  assert.equal(newer.quote.tariffRevision, 2);
  await deleteOrder(original.id);
  await restoreOrder(original.id);
  const persisted = (await getOrders()).find((row) => row.id === original.id);
  assert.equal(persisted.quote.total, 7150);
  assert.equal(persisted.quote.tariffRevision, 1);
  assert.ok(persisted.quote.estimatedAt);
  await assert.rejects(saveTariffs({}));
  assert.equal((await getTariffs()).revision, 2);
});
