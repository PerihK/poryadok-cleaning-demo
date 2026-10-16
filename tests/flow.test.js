import test from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { validateStep, today, addDays } from "../src/data.js";
globalThis.indexedDB = indexedDB;
globalThis.window = new EventTarget();
globalThis.BroadcastChannel = undefined;
const { getOrders, createOrder, updateOrder, deleteOrder, restoreOrder } =
  await import("../src/db.js");
const form = {
  service: "general",
  property: "apartment",
  rooms: "2",
  area: "65",
  frequency: "Разовая уборка",
  extras: ["Мытьё окон"],
  date: addDays(today(), 1),
  time: "12:00–15:00",
  address: "Санкт-Петербург, пример адреса, дом 10",
  access: "Подъезд 1",
  notes: "Уделить внимание кухне",
  photos: [
    {
      id: "photo-1",
      name: "room.jpg",
      data: "data:image/jpeg;base64,dGVzdA==",
    },
  ],
  name: "Гость демоверсии",
  phone: "+7 (999) 000-00-00",
  consent: true,
};
test("required fields, area, date, Russian phone, and demo consent are validated", () => {
  for (let step = 0; step < 3; step++)
    assert.deepEqual(validateStep(step, form), {});
  assert.ok(validateStep(0, { ...form, area: "0" }).area);
  assert.ok(validateStep(0, { ...form, area: "5001" }).area);
  assert.ok(
    validateStep(1, { ...form, date: addDays(today(), -1), address: "" }).date,
  );
  assert.ok(
    validateStep(1, { ...form, date: addDays(today(), -1), address: "" })
      .address,
  );
  assert.ok(validateStep(2, { ...form, phone: "123", consent: false }).phone);
  assert.ok(validateStep(2, { ...form, phone: "123", consent: false }).consent);
});

test("client request with photo appears in CRM and status/note/history persist", async () => {
  const initial = await getOrders();
  assert.equal(initial.length, 3);
  assert.ok(initial.every((x) => x.sample));
  const created = await createOrder(form);
  assert.equal(created.id, "ПК-1004");
  assert.equal(created.status, "new");
  assert.equal(created.sample, false);
  const inCRM = (await getOrders()).find((x) => x.id === created.id);
  assert.deepEqual(inCRM.photos, form.photos);
  assert.equal(inCRM.area, "65");
  assert.equal(inCRM.rooms, "2");
  assert.equal(inCRM.access, form.access);
  await updateOrder(created.id, {
    status: "processing",
    adminNote: "Уточнить окна",
  });
  const persisted = (await getOrders()).find((x) => x.id === created.id);
  assert.equal(persisted.status, "processing");
  assert.equal(persisted.adminNote, "Уточнить окна");
  assert.equal(persisted.history.length, 2);
  assert.equal(persisted.history[1].status, "processing");
  assert.deepEqual(persisted.photos, form.photos);
  await updateOrder(created.id, {
    status: "processing",
    adminNote: "Клиент ответил",
  });
  assert.equal(
    (await getOrders()).find((x) => x.id === created.id).history.length,
    2,
  );
});
test("concurrent submissions get distinct request numbers without overwriting records", async () => {
  const created = await Promise.all([
    createOrder(form),
    createOrder({ ...form, name: "Другой гость" }),
  ]);
  assert.notEqual(created[0].id, created[1].id);
  const all = await getOrders();
  assert.ok(created.every((row) => all.some((x) => x.id === row.id)));
});

test("deleted orders stay out of CRM after re-read and can be restored with photos", async () => {
  const order = await createOrder(form);
  const removed = await deleteOrder(order.id);
  assert.ok(removed.deletedAt);
  assert.ok(!(await getOrders()).some((row) => row.id === order.id));
  const trash = await getOrders({ includeDeleted: true });
  assert.deepEqual(
    trash.find((row) => row.id === order.id).photos,
    form.photos,
  );
  await restoreOrder(order.id);
  const restored = (await getOrders()).find((row) => row.id === order.id);
  assert.equal(restored.deletedAt, null);
  assert.deepEqual(restored.photos, form.photos);
});
