export const extraServices = [
  {
    id: "windows",
    name: "Мытьё окон",
    unit: "створок",
    hint: "Количество створок",
  },
  {
    id: "balcony",
    name: "Балкон / лоджия",
    unit: "м²",
    hint: "Площадь балкона, м²",
  },
  {
    id: "cabinets",
    name: "Внутри шкафов",
    unit: "секций",
    hint: "Количество секций",
  },
  {
    id: "appliances",
    name: "Кухонная техника",
    unit: "приборов",
    hint: "Количество приборов",
  },
];

export const defaultTariffs = {
  revision: 1,
  updatedAt: null,
  services: {
    general: { rate: 110, minimum: 5000 },
    regular: { rate: 65, minimum: 3000 },
    renovation: { rate: 150, minimum: 6500 },
    office: { rate: 55, minimum: 3500 },
  },
  extras: { windows: 500, balcony: 350, cabinets: 600, appliances: 700 },
};

export const money = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

export function validateTariffs(value) {
  for (const id of Object.keys(defaultTariffs.services)) {
    const row = value?.services?.[id];
    if (
      !row ||
      !Number.isInteger(row.rate) ||
      row.rate < 1 ||
      row.rate > 100000 ||
      !Number.isInteger(row.minimum) ||
      row.minimum < 0 ||
      row.minimum > 1000000
    ) {
      throw new Error(
        "Тариф: от 1 до 100 000 ₽/м². Минимум: от 0 до 1 000 000 ₽. Введите целые числа.",
      );
    }
  }
  for (const extra of extraServices) {
    const rate = value?.extras?.[extra.id];
    if (!Number.isInteger(rate) || rate < 0 || rate > 100000) {
      throw new Error(
        "Стоимость дополнительной услуги: целое число от 0 до 100 000 ₽.",
      );
    }
  }
  return value;
}

export function extraErrors(form) {
  const selected = extraServices.filter((item) =>
    form.extras?.includes(item.name),
  );
  return selected.some((item) => {
    const quantity = Number(form.extraQuantities?.[item.id] ?? 1);
    return !Number.isInteger(quantity) || quantity < 1 || quantity > 100;
  });
}

export function estimatePrice(form, tariffs = defaultTariffs) {
  const area = Number(form.area);
  const service = tariffs.services[form.service];
  if (
    !service ||
    !Number.isFinite(area) ||
    area < 10 ||
    area > 5000 ||
    extraErrors(form)
  )
    return null;
  const areaAmount = Math.round(area * service.rate);
  const baseAmount = Math.max(areaAmount, service.minimum);
  const extras = extraServices
    .filter((item) => form.extras?.includes(item.name))
    .map((item) => {
      const quantity = Number(form.extraQuantities?.[item.id] ?? 1);
      const rate = tariffs.extras[item.id];
      return {
        id: item.id,
        label: item.name,
        quantity,
        unit: item.unit,
        rate,
        amount: quantity * rate,
      };
    });
  return {
    area,
    rate: service.rate,
    minimum: service.minimum,
    areaAmount,
    baseAmount,
    minimumApplied: areaAmount < service.minimum,
    extras,
    total: baseAmount + extras.reduce((sum, item) => sum + item.amount, 0),
    tariffRevision: tariffs.revision,
  };
}
