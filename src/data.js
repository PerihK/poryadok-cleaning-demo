import { extraErrors } from "./pricing.js";
export const services = [
  {
    id: "general",
    name: "Генеральная уборка",
    short: "Генеральная",
    description: "Когда хочется чистоты в каждой детали.",
    icon: "sparkles",
    tag: "Свежий старт",
    details: [
      "Тщательная уборка комнат",
      "Кухня и санузлы",
      "Поверхности и труднодоступные места",
    ],
  },
  {
    id: "regular",
    name: "Регулярная уборка",
    short: "Регулярная",
    description: "Порядок, который становится привычкой.",
    icon: "repeat",
    tag: "На каждый день",
    details: [
      "Влажная уборка и удаление пыли",
      "Порядок на кухне и в санузле",
      "Удобная для вас периодичность",
    ],
  },
  {
    id: "renovation",
    name: "После ремонта",
    short: "После ремонта",
    description: "Ремонт закончен. Осталось только выдохнуть.",
    icon: "paint",
    tag: "Новая глава",
    details: [
      "Удаление строительной пыли",
      "Очистка поверхностей",
      "Подготовка помещения к жизни",
    ],
  },
  {
    id: "office",
    name: "Уборка офиса",
    short: "Для бизнеса",
    description: "Чистое пространство для больших идей.",
    icon: "building",
    tag: "Для команды",
    details: [
      "Рабочие и общие зоны",
      "Санузлы и кухня",
      "Разовая или регулярная уборка",
    ],
  },
];
export const serviceById = (id) =>
  services.find((s) => s.id === id) || services[0];
export const statuses = [
  { id: "new", label: "Новая", color: "blue" },
  { id: "processing", label: "В обработке", color: "amber" },
  { id: "confirmed", label: "Согласована", color: "purple" },
  { id: "completed", label: "Выполнена", color: "green" },
  { id: "cancelled", label: "Отменена", color: "gray" },
];
export const statusById = (id) =>
  statuses.find((s) => s.id === id) || statuses[0];
export const propertyNames = {
  apartment: "Квартира",
  house: "Дом",
  office: "Офис",
  commercial: "Другое помещение",
};
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const localDate = (value) => new Date(`${value}T12:00:00`);
export const formatDate = (value, options = {}) =>
  value
    ? localDate(value).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        ...options,
      })
    : "Не выбрана";
export const formatTime = (value) =>
  new Date(value).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
export function addDays(value, count) {
  const date = localDate(value);
  date.setDate(date.getDate() + count);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validPhone(value) {
  return /^(7|8)\d{10}$/.test(value.replace(/\D/g, ""));
}
export function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!services.some((s) => s.id === form.service))
      errors.service = "Выберите услугу";
    if (!propertyNames[form.property])
      errors.property = "Выберите тип помещения";
    if (
      !Number.isFinite(Number(form.area)) ||
      Number(form.area) < 10 ||
      Number(form.area) > 5000
    )
      errors.area = "Укажите площадь от 10 до 5 000 м²";
    if (extraErrors(form))
      errors.extras = "Укажите количество от 1 до 100 для выбранных дополнений";
    if (!form.rooms) errors.rooms = "Выберите количество комнат";
  }
  if (step === 1) {
    const parsed = localDate(form.date);
    const dateParts = String(form.date).split("-").map(Number);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.getFullYear() !== dateParts[0] ||
      parsed.getMonth() + 1 !== dateParts[1] ||
      parsed.getDate() !== dateParts[2] ||
      form.date < today()
    )
      errors.date = "Выберите сегодняшнюю или будущую дату";
    if (!form.time) errors.time = "Выберите желаемое время";
    if (form.address.trim().length < 5)
      errors.address = "Укажите улицу и номер дома";
  }
  if (step === 2) {
    if (form.name.trim().length < 2)
      errors.name = "Укажите имя, минимум 2 символа";
    if (!validPhone(form.phone))
      errors.phone = "Укажите телефон: +7 и ещё 10 цифр";
    if (!form.consent)
      errors.consent = "Подтвердите сохранение демонстрационной заявки";
  }
  return errors;
}
