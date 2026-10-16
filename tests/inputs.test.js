import test from "node:test";
import assert from "node:assert/strict";
import { maskPhone, deletePhoneDigit, phoneCaret } from "../src/phone.js";
import { createAddressSearch } from "../src/address-search.js";

test("phone mask accepts pasted Russian numbers and limits national digits", () => {
  for (const number of [
    "89001234567",
    "+79001234567",
    "9001234567",
    "+7 (900) 123-45-67",
  ])
    assert.equal(maskPhone(number), "+7 (900) 123-45-67");
  assert.equal(maskPhone("900123456712345"), "+7 (900) 123-45-67");
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("8"), "+7");
});
test("backspace removes a digit across mask punctuation, not the country code", () => {
  const prefix = "+7 (900)";
  assert.equal(
    deletePhoneDigit(prefix, prefix.length, prefix.length, "backward").value,
    "+7 (90",
  );
  assert.equal(deletePhoneDigit("+7", 2, 2, "backward").value, "+7");
  assert.deepEqual(deletePhoneDigit("+7 (900) 123-45-67", 0, 18, "backward"), {
    value: "",
    caret: 0,
  });
  assert.equal(phoneCaret("+7 (900) 123-45-67", 3), 9);
  const middle = deletePhoneDigit("+7 (900) 123-45-67", 8, 8, "backward");
  assert.equal(middle.value, "+7 (901) 234-56-7");
});

const features = [
  {
    properties: {
      countrycode: "RU",
      type: "house",
      housenumber: "30",
      street: "Екатерининская улица",
      city: "Мурино",
      state: "Ленинградская область",
    },
  },
  {
    properties: {
      countrycode: "RU",
      name: "Магазин",
      type: "house",
      housenumber: "30",
      street: "Екатерининская улица",
      city: "Мурино",
      state: "Ленинградская область",
    },
  },
  { properties: { countrycode: "DE", name: "Другой адрес", city: "Берлин" } },
];
test("real address responses are deduplicated, retain city/region, and are cached", async () => {
  let calls = 0;
  const search = createAddressSearch({
    fetchImpl: async (url) => {
      calls++;
      assert.equal(url.hostname, "photon.komoot.io");
      return { ok: true, json: async () => ({ features }) };
    },
  });
  const query = "Екатерининская 30 Мурино";
  const result = await search(query);
  assert.equal(result.length, 1);
  assert.equal(
    result[0].label,
    "Мурино, Ленинградская область, Екатерининская улица, 30",
  );
  await search(query);
  assert.equal(calls, 1);
  assert.deepEqual(await search("a"), []);
  assert.equal(calls, 1);
});
test("provider failures are reported without invented addresses", async () => {
  const search = createAddressSearch({
    fetchImpl: async () => {
      throw new Error("network offline");
    },
  });
  await assert.rejects(search("test"), /network offline/);
});

test("a cancelled address request cannot return stale suggestions", async () => {
  const controller = new AbortController();
  const search = createAddressSearch({
    fetchImpl: async () => {
      controller.abort();
      return { ok: true, json: async () => ({ features }) };
    },
  });
  await assert.rejects(
    search("Екатерининская", { signal: controller.signal }),
    { name: "AbortError" },
  );
});
