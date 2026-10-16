import { defaultTariffs, estimatePrice, validateTariffs } from "./pricing.js";
import { today, addDays } from "./data.js";
const DB_NAME = "poryadok-demo-v1";
let dbPromise;
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("poryadok-data")
    : null;
function openDB() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("orders", { keyPath: "id" });
        req.result.createObjectStore("meta", { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = undefined;
        reject(
          new Error(
            "Браузер не разрешил сохранение. Откройте демку в обычной вкладке и попробуйте ещё раз.",
          ),
        );
      };
    });
  return dbPromise;
}
function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () =>
      reject(tx.error || new Error("Не удалось сохранить данные."));
    tx.onabort = () => reject(tx.error || new Error("Сохранение прервано."));
  });
}
function announce() {
  window.dispatchEvent(new Event("poryadok-data"));
  channel?.postMessage("changed");
}
if (channel)
  channel.onmessage = () => window.dispatchEvent(new Event("poryadok-data"));
export async function seedDemo() {
  const db = await openDB();
  const tx = db.transaction(["orders", "meta"], "readwrite");
  const done = transactionDone(tx);
  const meta = tx.objectStore("meta");
  const check = meta.get("seeded");
  check.onsuccess = () => {
    if (check.result) return;
    const base = {
      rooms: "2",
      area: "65",
      property: "apartment",
      address: "Санкт-Петербург, пример адреса",
      time: "09:00–12:00",
      frequency: "Разовая уборка",
      extras: [],
      notes: "",
      photos: [],
      adminNote: "",
      phone: "",
      sample: true,
      history: [],
    };
    const examples = [
      {
        id: "ПК-1001",
        name: "Анна · пример",
        service: "general",
        status: "new",
        date: addDays(today(), 1),
        address: "Санкт-Петербург, Примерная улица · демо",
        notes:
          "Особое внимание кухне. Все данные в этой карточке демонстрационные.",
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: "ПК-1002",
        name: "Офис · пример",
        service: "office",
        status: "processing",
        property: "office",
        area: "120",
        rooms: "4",
        date: addDays(today(), 2),
        frequency: "Раз в неделю",
        address: "Санкт-Петербург, Деловая улица · демо",
        time: "18:00–21:00",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ПК-1003",
        name: "Михаил · пример",
        service: "renovation",
        status: "confirmed",
        area: "80",
        rooms: "3",
        date: addDays(today(), 3),
        address: "Санкт-Петербург, Уютная улица · демо",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    for (const row of examples)
      tx.objectStore("orders").put({
        ...base,
        ...row,
        history: [{ status: row.status, at: row.createdAt }],
        quote: estimatePrice({ ...base, ...row }),
      });
    meta.put({ key: "seeded", value: true });
    meta.put({ key: "counter", value: 1003 });
  };
  await done;
}
export async function getOrders({ includeDeleted = false } = {}) {
  await seedDemo();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction("orders").objectStore("orders").getAll();
    request.onsuccess = () =>
      resolve(
        request.result
          .filter((order) => includeDeleted || !order.deletedAt)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    request.onerror = () => reject(request.error);
  });
}
export async function createOrder(form) {
  await seedDemo();
  const tariffs = await getTariffs();
  const quote = estimatePrice(form, tariffs);
  if (!quote)
    throw new Error("Проверьте площадь и количество дополнительных услуг.");
  const db = await openDB();
  const tx = db.transaction(["orders", "meta"], "readwrite");
  const done = transactionDone(tx);
  let order;
  const counter = tx.objectStore("meta").get("counter");
  counter.onsuccess = () => {
    const next = (counter.result?.value || 1003) + 1;
    const at = new Date().toISOString();
    const { consent, ...data } = form;
    order = {
      ...data,
      quote: { ...quote, estimatedAt: at },
      name: form.name.trim(),
      address: form.address.trim(),
      id: `ПК-${next}`,
      status: "new",
      createdAt: at,
      sample: false,
      adminNote: "",
      history: [{ status: "new", at }],
    };
    tx.objectStore("orders").add(order);
    tx.objectStore("meta").put({ key: "counter", value: next });
  };
  await done;
  announce();
  return order;
}
export async function updateOrder(id, changes) {
  const db = await openDB();
  const tx = db.transaction("orders", "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore("orders");
  const request = store.get(id);
  let updated;
  request.onsuccess = () => {
    if (!request.result) {
      tx.abort();
      return;
    }
    updated = { ...request.result, ...changes };
    if (changes.status && changes.status !== request.result.status)
      updated.history = [
        ...request.result.history,
        { status: changes.status, at: new Date().toISOString() },
      ];
    store.put(updated);
  };
  await done;
  announce();
  return updated;
}

export async function deleteOrder(id) {
  return updateOrder(id, { deletedAt: new Date().toISOString() });
}

export async function restoreOrder(id) {
  return updateOrder(id, { deletedAt: null });
}

export async function getTariffs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction("meta").objectStore("meta").get("tariffs");
    request.onsuccess = () =>
      resolve(request.result?.value || structuredClone(defaultTariffs));
    request.onerror = () => reject(request.error);
  });
}
export async function saveTariffs(value) {
  validateTariffs(value);
  const db = await openDB();
  const tx = db.transaction("meta", "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore("meta");
  const request = store.get("tariffs");
  let saved;
  request.onsuccess = () => {
    saved = {
      services: structuredClone(value.services),
      extras: structuredClone(value.extras),
      revision: (request.result?.value?.revision || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    store.put({ key: "tariffs", value: saved });
  };
  await done;
  announce();
  return saved;
}
