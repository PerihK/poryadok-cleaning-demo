import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  Sparkles,
  Repeat2,
  PaintRoller,
  Building2,
  Home,
  MapPin,
  Phone,
  CalendarDays,
  Clock3,
  Camera,
  ImagePlus,
  Leaf,
  ShieldCheck,
  Menu,
  Search,
  SlidersHorizontal,
  LayoutDashboard,
  Inbox,
  CircleHelp,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Download,
  RotateCcw,
  Star,
  CircleDot,
  Trash2,
} from "lucide-react";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./updates.css";
import "./portfolio.css";
import { Header, Footer, Landing } from "./Site.jsx";
import { estimatePrice, money } from "./pricing.js";
import {
  useTariffs,
  PriceBreakdown,
  ExtraOptions,
  TariffEditor,
} from "./Pricing.jsx";
import {
  services,
  serviceById,
  statuses,
  statusById,
  propertyNames,
  today,
  addDays,
  localDate,
  formatDate,
  formatTime,
  validateStep,
} from "./data";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  restoreOrder,
} from "./db";
import PhoneInput from "./PhoneInput.jsx";
import AddressInput from "./AddressInput.jsx";

const icons = {
  sparkles: Sparkles,
  repeat: Repeat2,
  paint: PaintRoller,
  building: Building2,
};
let navigate;
function Link({ href, children, className = "", onClick, ...props }) {
  return (
    <a
      href={href}
      className={className}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (
          !e.defaultPrevented &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          e.button === 0 &&
          href.startsWith("/")
        ) {
          e.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}
function Brand({ light = false }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Порядок — главная"
    >
      <span className="brand-symbol" aria-hidden="true">
        ◒
      </span>
      <span>
        порядок<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
function ServiceIcon({ id, size = 24, ...props }) {
  const Icon = icons[serviceById(id).icon];
  return <Icon size={size} strokeWidth={1.5} {...props} />;
}
function Status({ id }) {
  const status = statusById(id);
  return (
    <span className={`status status-${status.color}`}>
      <i />
      {status.label}
    </span>
  );
}
function DemoBar({ admin }) {
  return (
    <div className="demo-bar">
      <div className="demo-label">
        <span className="live-dot" /> <span>Интерактивная демоверсия</span>
      </div>
      <div className="demo-switch">
        <Link href="/" className={!admin ? "active" : ""}>
          <Home size={13} />
          <span>Клиент</span>
        </Link>
        <Link href="/admin" className={admin ? "active" : ""}>
          <LayoutDashboard size={13} />
          <span>CRM</span>
        </Link>
      </div>
    </div>
  );
}
function Calendar({ value, onChange, error }) {
  const [month, setMonth] = useState(() => {
    const d = localDate(value || today());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const start = (month.getDay() + 6) % 7,
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstCurrent = localDate(today());
  firstCurrent.setDate(1);
  const keyFor = (n) =>
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
  return (
    <div className={`calendar ${error ? "field-invalid" : ""}`}>
      <div className="calendar-heading">
        <strong>
          {month.toLocaleDateString("ru-RU", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label="Предыдущий месяц"
            disabled={month <= firstCurrent}
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Следующий месяц"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-days">
        {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((d) => (
          <span className="weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: start }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const key = keyFor(i + 1);
          return (
            <button
              type="button"
              key={key}
              className={`${value === key ? "selected" : ""} ${key === today() ? "today" : ""}`}
              disabled={key < today()}
              aria-label={formatDate(key, { year: "numeric" })}
              aria-pressed={value === key}
              onClick={() => onChange(key)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <p className="calendar-foot">
        <Clock3 size={13} /> Время московское · UTC+3
      </p>
    </div>
  );
}
async function readPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Добавьте фото в формате JPG, PNG или WebP.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Фотография слишком большая. Максимум — 10 МБ.");
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать фото."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Не удалось открыть фото. Попробуйте другое."));
    image.src = source;
  });
  const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    data: canvas.toDataURL("image/jpeg", 0.78),
  };
}
function ErrorText({ error, id }) {
  return error ? (
    <span className="field-error" id={id}>
      {error}
    </span>
  ) : null;
}
function Field({ label, error, children, optional, ...props }) {
  return (
    <div className="field" {...props}>
      <label>
        {label}
        {optional && <span>необязательно</span>}
      </label>
      {children}
      <ErrorText error={error} />
    </div>
  );
}
const emptyForm = (service) => ({
  service: service || "general",
  property: service === "office" ? "office" : "apartment",
  rooms: "2",
  area: "",
  frequency: "Разовая уборка",
  extras: [],
  extraQuantities: {},
  date: "",
  time: "",
  address: "",
  access: "",
  notes: "",
  photos: [],
  name: "",
  phone: "",
  consent: false,
});
function Order() {
  const { tariffs, ready: tariffsReady, error: tariffError } = useTariffs();
  const requestedService = new URLSearchParams(location.search).get("service");
  const serviceParam = services.some((item) => item.id === requestedService)
    ? requestedService
    : null;
  const [form, setForm] = useState(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem("poryadok-draft"));
      return draft
        ? {
            ...emptyForm(),
            ...draft,
            ...(serviceParam
              ? {
                  service: serviceParam,
                  ...(serviceParam === "office" ? { property: "office" } : {}),
                }
              : {}),
          }
        : emptyForm(serviceParam);
    } catch {
      return emptyForm(serviceParam);
    }
  });
  const [step, setStep] = useState(0),
    [errors, setErrors] = useState({}),
    [uploading, setUploading] = useState(false),
    [busy, setBusy] = useState(false),
    [submitError, setSubmitError] = useState(""),
    [success, setSuccess] = useState(null);
  const quote = estimatePrice(form, tariffs);
  const uploadRef = useRef(),
    formHeading = useRef();
  useEffect(() => {
    try {
      if (!success)
        sessionStorage.setItem("poryadok-draft", JSON.stringify(form));
    } catch {}
  }, [form, success]);
  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };
  const move = (next) => {
    const errs = next > step ? validateStep(step, form) : {};
    setErrors(errs);
    if (Object.keys(errs).length) {
      setTimeout(
        () => document.querySelector('[aria-invalid="true"]')?.focus(),
        0,
      );
      return;
    }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => formHeading.current?.focus(), 0);
  };
  const upload = async (files) => {
    setSubmitError("");
    if (form.photos.length + files.length > 5) {
      setSubmitError("Можно добавить до 5 фотографий.");
      return;
    }
    setUploading(true);
    try {
      const photos = await Promise.all(Array.from(files).map(readPhoto));
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...photos] }));
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (busy || !tariffsReady) return;
    for (let i = 0; i < 3; i++) {
      const errs = validateStep(i, form);
      if (Object.keys(errs).length) {
        setStep(i);
        setErrors(errs);
        return;
      }
    }
    setBusy(true);
    setSubmitError("");
    try {
      const order = await createOrder(form);
      sessionStorage.removeItem("poryadok-draft");
      setSuccess(order);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(
        e.message || "Не удалось сохранить заявку. Попробуйте ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  };
  const fillExample = () => {
    setForm({
      ...emptyForm(),
      area: "65",
      date: addDays(today(), 1),
      time: "12:00–15:00",
      address: "Санкт-Петербург, Примерная улица, дом 10 · демо",
      name: "Гость демоверсии",
      phone: "+7 (999) 000-00-00",
      notes: "Особое внимание кухне и ванной. Демонстрационная заявка.",
    });
    setErrors({});
    setStep(0);
  };
  if (success)
    return (
      <>
        <Header />
        <main className="success-page container">
          <div className="success-card">
            <div className="success-icon">
              <Check size={36} />
            </div>
            <span className="eyebrow">ЗАЯВКА {success.id}</span>
            <h1>
              Первый шаг
              <br />к чистоте <em>сделан.</em>
            </h1>
            <p>
              Все детали сохранены. Теперь посмотрите,
              <br className="desktop-br" /> как ваша заявка выглядит у
              администратора.
            </p>
            <div className="success-summary">
              <span>
                <ServiceIcon id={success.service} />
                {serviceById(success.service).name}
              </span>
              <span>
                <Home size={20} />
                {propertyNames[success.property]} · {success.rooms} комн. ·{" "}
                {success.area} м²
              </span>
              <span>
                <CalendarDays size={20} />
                {formatDate(success.date)} · {success.time}
              </span>
              <span>
                <Camera size={20} />
                {success.photos.length
                  ? `Фотографий: ${success.photos.length}`
                  : "Без фотографий"}
              </span>
            </div>
            <PriceBreakdown quote={success.quote} compact />
            <Link
              href={`/admin?order=${encodeURIComponent(success.id)}`}
              className="button"
            >
              Открыть заявку в CRM <ArrowUpRight size={19} />
            </Link>
            <Link href="/" className="text-link">
              Вернуться на главную <ArrowRight size={16} />
            </Link>
            <div className="demo-disclaimer">
              <CircleHelp size={16} />
              <span>
                Это демонстрация. Заявка хранится в этом браузере и не
                отправлена в компанию.
              </span>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  const titles = [
    "Какая уборка вам нужна?",
    "Когда и куда приехать?",
    "Как с вами связаться?",
  ];
  return (
    <>
      <Header />
      <main className="order-page container">
        <div className="order-heading">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> На главную
          </Link>
          <button className="example-button" onClick={fillExample}>
            <Sparkles size={14} /> Заполнить пример
          </button>
        </div>
        <div className="order-intro">
          <span className="eyebrow">ПАРА МИНУТ — И МОЖНО ВЫДОХНУТЬ</span>
          <h1>
            Ваша чистота
            <br className="mobile-br" /> начинается <em>здесь.</em>
          </h1>
          <p>Расскажите о помещении. Мы соберём всё в одну заявку.</p>
        </div>
        <div className="order-layout">
          <form className="order-form" onSubmit={submit} noValidate>
            <div className="stepper" aria-label="Этапы оформления">
              {["Уборка", "Детали", "Контакты"].map((name, i) => (
                <button
                  type="button"
                  key={name}
                  disabled={i > step}
                  onClick={() => move(i)}
                  className={i === step ? "current" : i < step ? "done" : ""}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span>{i < step ? <Check size={14} /> : i + 1}</span>
                  {name}
                  {i < 2 && <i />}
                </button>
              ))}
            </div>
            <div className="form-body">
              <div className="form-title">
                <span>0{step + 1}</span>
                <h2 ref={formHeading} tabIndex={-1}>
                  {titles[step]}
                </h2>
              </div>
              {step === 0 && (
                <>
                  <Field label="Вид уборки" error={errors.service}>
                    <div className="service-options">
                      {services.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => {
                            set("service", s.id);
                            if (s.id === "office") set("property", "office");
                          }}
                          className={form.service === s.id ? "selected" : ""}
                          aria-pressed={form.service === s.id}
                        >
                          <ServiceIcon id={s.id} size={22} />
                          <span>{s.name}</span>
                          <span className="choice-radio">
                            {form.service === s.id && <span />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Тип помещения" error={errors.property}>
                    <div className="segmented property-options">
                      {Object.entries(propertyNames).map(([id, name]) => (
                        <button
                          type="button"
                          key={id}
                          className={form.property === id ? "selected" : ""}
                          onClick={() => set("property", id)}
                          aria-pressed={form.property === id}
                        >
                          {id === "commercial" ? "Другое" : name}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="two-fields">
                    <Field
                      label={
                        ["office", "commercial"].includes(form.property)
                          ? "Количество помещений"
                          : "Количество комнат"
                      }
                      error={errors.rooms}
                    >
                      <select
                        aria-label="Количество комнат"
                        value={form.rooms}
                        onChange={(e) => set("rooms", e.target.value)}
                      >
                        {["1", "2", "3", "4", "5", "6+"].map((n) => (
                          <option key={n} value={n}>
                            {n === "1"
                              ? "1 комната"
                              : n === "6+"
                                ? "6 и больше"
                                : `${n} ${n === "5" ? "комнат" : "комнаты"}`}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Площадь помещения" error={errors.area}>
                      <div className="input-unit">
                        <input
                          name="area"
                          aria-label="Площадь помещения"
                          type="number"
                          min="10"
                          max="5000"
                          inputMode="numeric"
                          placeholder="Например, 65"
                          value={form.area}
                          aria-invalid={!!errors.area}
                          onChange={(e) => set("area", e.target.value)}
                        />
                        <span>м²</span>
                      </div>
                    </Field>
                  </div>
                  {["regular", "office"].includes(form.service) && (
                    <Field label="Как часто нужна уборка?">
                      <select
                        value={form.frequency}
                        aria-label="Периодичность уборки"
                        onChange={(e) => set("frequency", e.target.value)}
                      >
                        {[
                          "Разовая уборка",
                          "Раз в неделю",
                          "Два раза в неделю",
                          "Раз в месяц",
                          "Обсудим индивидуально",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="Дополнительные услуги" optional>
                    <ExtraOptions
                      form={form}
                      tariffs={tariffs}
                      error={errors.extras}
                      onChange={(changes) => {
                        setForm((prev) => ({ ...prev, ...changes }));
                        setErrors((prev) => ({ ...prev, extras: null }));
                      }}
                    />
                    <span className="field-hint">
                      Количество и площадь дополнений влияют на примерную
                      стоимость.
                    </span>
                  </Field>
                </>
              )}
              {step === 1 && (
                <>
                  <div className="date-time-grid">
                    <Field label="Желаемая дата" error={errors.date}>
                      <Calendar
                        value={form.date}
                        onChange={(value) => set("date", value)}
                        error={errors.date}
                      />
                    </Field>
                    <Field label="Удобное время" error={errors.time}>
                      <div className="time-options">
                        {[
                          "09:00–12:00",
                          "12:00–15:00",
                          "15:00–18:00",
                          "18:00–21:00",
                        ].map((t) => (
                          <button
                            type="button"
                            key={t}
                            className={form.time === t ? "selected" : ""}
                            aria-pressed={form.time === t}
                            onClick={() => set("time", t)}
                          >
                            <Clock3 size={16} />
                            {t}
                            {form.time === t && <Check size={15} />}
                          </button>
                        ))}
                      </div>
                      <span className="field-hint">
                        Дата и время предварительные. Подтверждаются при
                        согласовании.
                      </span>
                    </Field>
                  </div>
                  <Field label="Адрес помещения" error={errors.address}>
                    <AddressInput
                      value={form.address}
                      error={errors.address}
                      onChange={(value) => set("address", value)}
                    />
                  </Field>
                  <Field label="Как попасть внутрь" optional>
                    <input
                      aria-label="Как попасть внутрь"
                      placeholder="Подъезд, этаж, домофон — если нужно"
                      value={form.access}
                      maxLength={300}
                      onChange={(e) => set("access", e.target.value)}
                    />
                  </Field>
                  <Field label="Ваши пожелания" optional>
                    <textarea
                      aria-label="Ваши пожелания"
                      rows={3}
                      placeholder="Например, уделить больше внимания кухне или учесть домашних животных"
                      value={form.notes}
                      maxLength={2000}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </Field>
                  <Field label="Фотографии помещения" optional>
                    <input
                      ref={uploadRef}
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      aria-label="Прикрепить фотографии"
                      onChange={(e) => upload(e.target.files)}
                    />
                    <button
                      type="button"
                      className="upload-zone"
                      disabled={uploading || form.photos.length >= 5}
                      onClick={() => uploadRef.current.click()}
                    >
                      <span className="upload-icon">
                        <ImagePlus size={24} />
                      </span>
                      <strong>
                        {uploading
                          ? "Обрабатываем фото…"
                          : "Добавить фотографии"}
                      </strong>
                      <span>До 5 фото · JPG, PNG, WebP · до 10 МБ каждое</span>
                      <small>Помогут точнее оценить объём уборки</small>
                    </button>
                    {form.photos.length > 0 && (
                      <div className="photo-grid">
                        {form.photos.map((p) => (
                          <div key={p.id}>
                            <img src={p.data} alt={p.name} />
                            <button
                              type="button"
                              className="photo-remove"
                              aria-label={`Удалить ${p.name}`}
                              onClick={() =>
                                set(
                                  "photos",
                                  form.photos.filter((x) => x.id !== p.id),
                                )
                              }
                            >
                              <X size={13} />
                            </button>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="contact-note">
                    <MessageSquare size={20} />
                    <span>
                      Оставьте контакт, чтобы можно было уточнить детали и
                      согласовать уборку.
                    </span>
                  </div>
                  <Field label="Ваше имя" error={errors.name}>
                    <input
                      autoComplete="given-name"
                      aria-label="Ваше имя"
                      placeholder="Как к вам обращаться?"
                      value={form.name}
                      maxLength={100}
                      aria-invalid={!!errors.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Номер телефона" error={errors.phone}>
                    <PhoneInput
                      value={form.phone}
                      error={errors.phone}
                      onChange={(value) => set("phone", value)}
                    />
                  </Field>
                  <div className="review-box">
                    <div>
                      <h3>Проверим детали</h3>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => move(0)}
                      >
                        Изменить <ArrowUpRight size={14} />
                      </button>
                    </div>
                    <p>
                      <ServiceIcon id={form.service} size={18} />
                      {serviceById(form.service).name}
                    </p>
                    <p>
                      <Home size={18} />
                      {propertyNames[form.property]} · {form.rooms} комн. ·{" "}
                      {form.area} м²
                    </p>
                    <p>
                      <CalendarDays size={18} />
                      {formatDate(form.date)} · {form.time}
                    </p>
                    <p>
                      <MapPin size={18} />
                      {form.address}
                    </p>
                    <p>
                      <Camera size={18} />
                      {form.photos.length
                        ? `${form.photos.length} фото прикреплено`
                        : "Без фотографий"}
                    </p>
                    {form.extras.length > 0 && (
                      <p>
                        <Plus size={18} />
                        {form.extras.join(", ")}
                      </p>
                    )}
                  </div>
                  <PriceBreakdown quote={quote} compact />
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => set("consent", e.target.checked)}
                    />
                    <span>
                      Понимаю, что это демоверсия. Заявка и фотографии
                      сохранятся только в этом браузере и не поступят в
                      компанию.
                    </span>
                  </label>
                  <ErrorText error={errors.consent} />
                </>
              )}
              {submitError && (
                <div className="error-banner" role="alert">
                  {submitError}
                </div>
              )}
              <div className="mobile-price">
                <span>Примерно · демо-тариф</span>
                <strong>
                  {quote ? money(quote.total) : "Укажите площадь"}
                </strong>
                <small>Не окончательная цена</small>
              </div>
              <div className="form-navigation">
                {step > 0 ? (
                  <button
                    type="button"
                    className="back-link"
                    onClick={() => move(step - 1)}
                  >
                    <ArrowLeft size={17} /> Назад
                  </button>
                ) : (
                  <span className="form-duration">
                    <Clock3 size={14} /> Около 2 минут
                  </span>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    className="button"
                    disabled={uploading}
                    onClick={(e) => {
                      e.preventDefault();
                      move(step + 1);
                    }}
                  >
                    Далее <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="button"
                    disabled={busy || !tariffsReady}
                  >
                    {busy ? "Сохраняем…" : "Отправить заявку"}{" "}
                    <ArrowUpRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </form>
          <aside className="order-aside">
            <div className="order-aside-image">
              <img src="/hero.webp" alt="Уютная гостиная" />
              <span>
                <Sparkles size={16} /> Скоро здесь будет свежее
              </span>
            </div>
            <div className="order-aside-body">
              <span className="eyebrow">ВАША УБОРКА</span>
              <h3>{serviceById(form.service).name}</h3>
              <div className="aside-details">
                <span>
                  <Home size={17} />
                  {propertyNames[form.property]}
                </span>
                <span>
                  <CircleDot size={17} />
                  {form.rooms} комн. {form.area && `· ${form.area} м²`}
                </span>
                {form.date && (
                  <span>
                    <CalendarDays size={17} />
                    {formatDate(form.date)}
                  </span>
                )}
              </div>
              <PriceBreakdown quote={quote} />
              {tariffError && (
                <p className="error-text" role="alert">
                  {tariffError}
                </p>
              )}
              <div className="aside-help">
                <ShieldCheck size={20} />
                <span>
                  В демке всё сохраняется
                  <br />
                  только в вашем браузере.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Modal({ children, onClose, className = "", label }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
function OrderDetail({ order, onClose, onUpdate, onDelete, onRestore }) {
  const [status, setStatus] = useState(order.status),
    [note, setNote] = useState(order.adminNote || ""),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(""),
    [photo, setPhoto] = useState(null),
    [deleteConfirm, setDeleteConfirm] = useState(false);
  const remove = async () => {
    setBusy(true);
    setFeedback("");
    try {
      await onDelete(order.id);
    } catch (e) {
      setFeedback(e.message || "Не удалось удалить заявку");
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    setBusy(true);
    setFeedback("");
    try {
      await onRestore(order.id);
    } catch (e) {
      setFeedback(e.message || "Не удалось восстановить заявку");
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setFeedback("");
    try {
      await onUpdate(order.id, { status, adminNote: note });
      setFeedback("Изменения сохранены");
    } catch (e) {
      setFeedback(e.message || "Не удалось сохранить изменения");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setStatus(order.status);
    setNote(order.adminNote || "");
  }, [order.status, order.adminNote]);
  return (
    <Modal
      onClose={onClose}
      label={`Заявка ${order.id}`}
      className="detail-modal"
    >
      <div className="detail-header">
        <div>
          <span className="eyebrow">
            {order.sample
              ? "ДЕМОНСТРАЦИОННЫЙ ПРИМЕР"
              : "ЗАЯВКА С КЛИЕНТСКОЙ СТРАНИЦЫ"}
          </span>
          <h2>{order.id}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Закрыть заявку"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <div className="detail-scroll">
        <div className="detail-client">
          <span className="avatar">{order.name[0]}</span>
          <div>
            <h3>{order.name}</h3>
            {order.phone ? (
              <a href={`tel:${order.phone.replace(/\D/g, "")}`}>
                {order.phone}
              </a>
            ) : (
              <span>Контакт не указан в примере</span>
            )}
          </div>
          <Status id={order.status} />
        </div>
        {order.deletedAt && (
          <div className="trash-note">
            <Trash2 size={16} /> Заявка в корзине. Её можно восстановить.
          </div>
        )}
        <div className="detail-section">
          <h4>Детали уборки</h4>
          <dl>
            <div>
              <dt>Услуга</dt>
              <dd>{serviceById(order.service).name}</dd>
            </div>
            <div>
              <dt>Помещение</dt>
              <dd>{propertyNames[order.property]}</dd>
            </div>
            <div>
              <dt>Комнаты / площадь</dt>
              <dd>
                {order.rooms} комн. · {order.area} м²
              </dd>
            </div>
            <div>
              <dt>Дата</dt>
              <dd>{formatDate(order.date, { year: "numeric" })}</dd>
            </div>
            <div>
              <dt>Время · МСК</dt>
              <dd>{order.time}</dd>
            </div>
            {["regular", "office"].includes(order.service) && (
              <div>
                <dt>Периодичность</dt>
                <dd>{order.frequency}</dd>
              </div>
            )}
            <div>
              <dt>Адрес</dt>
              <dd>{order.address}</dd>
            </div>
            {order.access && (
              <div>
                <dt>Доступ</dt>
                <dd>{order.access}</dd>
              </div>
            )}
            <div>
              <dt>Дополнительно</dt>
              <dd>
                {order.extras.length ? order.extras.join(", ") : "Не указано"}
              </dd>
            </div>
          </dl>
        </div>
        <div className="detail-section">
          <PriceBreakdown quote={order.quote} compact />
          <p className="quote-version">
            Тарифы на момент оформления · версия{" "}
            {order.quote?.tariffRevision || 1}
          </p>
        </div>
        <div className="detail-section">
          <h4>Пожелания клиента</h4>
          <p className="client-note">
            {order.notes || "Без дополнительных пожеланий"}
          </p>
        </div>
        <div className="detail-section">
          <h4>
            Фотографии <span>{order.photos.length}</span>
          </h4>
          {order.photos.length ? (
            <div className="detail-photos">
              {order.photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhoto(p)}
                  aria-label={`Открыть фото ${p.name}`}
                >
                  <img src={p.data} alt={p.name} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Фотографии не прикреплены</p>
          )}
        </div>
        {!order.deletedAt && (
          <div className="detail-section">
            <h4>Обработка заявки</h4>
            <Field label="Статус заявки">
              <select
                aria-label="Статус заявки"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setFeedback("");
                }}
              >
                {statuses.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Заметка администратора" optional>
              <textarea
                aria-label="Заметка администратора"
                placeholder="Например, уточнить количество окон"
                maxLength={2000}
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setFeedback("");
                }}
              />
            </Field>
          </div>
        )}
        <div className="detail-section">
          <h4>История заявки</h4>
          <div className="history">
            {[...order.history].reverse().map((h, i) => (
              <div key={`${h.at}-${i}`}>
                <span className="history-dot" />
                <strong>{statusById(h.status).label}</strong>
                <span>{formatTime(h.at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="detail-actions">
        {order.deletedAt ? (
          <button
            className="button restore-button"
            disabled={busy}
            onClick={restore}
          >
            <RotateCcw size={16} /> Восстановить заявку
          </button>
        ) : deleteConfirm ? (
          <div className="delete-confirm">
            <p>Переместить заявку {order.id} в корзину?</p>
            <span>Данные и фотографии можно будет восстановить.</span>
            <div>
              <button
                className="cancel-delete"
                disabled={busy}
                onClick={() => setDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                className="delete-button"
                disabled={busy}
                onClick={remove}
              >
                <Trash2 size={16} /> {busy ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="delete-button"
            disabled={busy}
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={16} /> Удалить
          </button>
        )}
        {feedback && (
          <span
            role="status"
            className={
              feedback === "Изменения сохранены"
                ? "save-feedback"
                : "field-error"
            }
          >
            {feedback === "Изменения сохранены" && <CheckCircle2 size={15} />}{" "}
            {feedback}
          </span>
        )}
        {!order.deletedAt && !deleteConfirm && (
          <button
            className="button"
            disabled={
              busy ||
              (status === order.status && note === (order.adminNote || ""))
            }
            onClick={save}
          >
            {busy ? "Сохраняем…" : "Сохранить изменения"} <Check size={17} />
          </button>
        )}
      </div>
      {photo && (
        <Modal
          onClose={() => setPhoto(null)}
          label={photo.name}
          className="photo-modal"
        >
          <button
            className="icon-button"
            onClick={() => setPhoto(null)}
            aria-label="Закрыть фотографию"
          >
            <X />
          </button>
          <img src={photo.data} alt={photo.name} />
          <p>{photo.name}</p>
        </Modal>
      )}
    </Modal>
  );
}
function AboutDemo({ onClose }) {
  return (
    <Modal label="О демоверсии" onClose={onClose} className="about-modal">
      <button className="icon-button" onClick={onClose} aria-label="Закрыть">
        <X />
      </button>
      <span className="eyebrow">ПОРЯДОК / ИНТЕРАКТИВНЫЙ ПРИМЕР</span>
      <h2>Пройдите весь путь.</h2>
      <p>
        Оформите заявку на клиентской странице, добавьте фотографии и откройте
        её здесь. Измените статус и сохраните заметку.
      </p>
      <div className="about-demo-points">
        <p>
          <CheckCircle2 /> Заявки, фото и статусы сохраняются после перезагрузки
          страницы.
        </p>
        <p>
          <Home /> Клиентская страница и CRM работают в одном браузере. На
          другом устройстве будут свои данные.
        </p>
        <p>
          <ShieldCheck /> Админка открыта для демонстрации. Уведомления,
          реальные заказы и оплата не подключены.
        </p>
        <p>
          <Inbox /> Три стартовые карточки — примеры с вымышленными данными.
        </p>
      </div>
      <Link href="/order" className="button">
        Попробовать оформить заявку <ArrowUpRight size={17} />
      </Link>
    </Modal>
  );
}
function Admin() {
  const [allOrders, setAllOrders] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [service, setService] = useState("all"),
    [selected, setSelected] = useState(null),
    [view, setView] = useState("orders"),
    [about, setAbout] = useState(false),
    [tariffOpen, setTariffOpen] = useState(false),
    [toast, setToast] = useState(""),
    [undoId, setUndoId] = useState(null);
  const orders = allOrders.filter((order) => !order.deletedAt);
  const deletedOrders = allOrders.filter((order) => order.deletedAt);
  const currentOrders = view === "trash" ? deletedOrders : orders;
  const chooseView = (next) => {
    setView(next);
    setFilter("all");
    setSearch("");
    setService("all");
  };
  const initiallyOpened = useRef(false);
  const refresh = async () => {
    try {
      const data = await getOrders({ includeDeleted: true });
      setAllOrders(data);
      setError("");
      if (!initiallyOpened.current) {
        const id = new URLSearchParams(location.search).get("order");
        if (id && data.some((x) => x.id === id)) setSelected(id);
        initiallyOpened.current = true;
      }
    } catch (e) {
      setError(e.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    window.addEventListener("poryadok-data", refresh);
    return () => window.removeEventListener("poryadok-data", refresh);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast("");
      setUndoId(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toast]);
  const change = async (id, data) => {
    const updated = await updateOrder(id, data);
    setAllOrders((prev) => prev.map((x) => (x.id === id ? updated : x)));
  };
  const remove = async (id) => {
    const updated = await deleteOrder(id);
    setAllOrders((prev) => prev.map((x) => (x.id === id ? updated : x)));
    setSelected(null);
    history.replaceState({}, "", "/admin");
    setToast("Заявка перемещена в корзину");
    setUndoId(id);
  };
  const restore = async (id) => {
    const updated = await restoreOrder(id);
    setAllOrders((prev) => prev.map((x) => (x.id === id ? updated : x)));
    setSelected(null);
    setUndoId(null);
    setToast("Заявка восстановлена");
  };
  const filtered = currentOrders.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (service === "all" || o.service === service) &&
      [o.id, o.name, o.phone, o.address, serviceById(o.service).name]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const actual = allOrders.find((o) => o.id === selected);
  const stats = [
    ["Всего заявок", orders.length, Inbox, "all"],
    ["Новые", orders.filter((x) => x.status === "new").length, Sparkles, "new"],
    [
      "В обработке",
      orders.filter((x) => x.status === "processing").length,
      Clock3,
      "processing",
    ],
    [
      "Согласованы",
      orders.filter((x) => x.status === "confirmed").length,
      CheckCircle2,
      "confirmed",
    ],
  ];
  const exportData = () => {
    const quote = (value) =>
      '"' + String(value ?? "").replaceAll('"', '""') + '"';
    const rows = [
      [
        "Номер",
        "Клиент",
        "Телефон",
        "Услуга",
        "Помещение",
        "Комнаты",
        "Площадь, м²",
        "Дата",
        "Время",
        "Адрес",
        "Пожелания",
        "Статус",
        "Заметка",
        "Тип данных",
        "Примерная стоимость, ₽",
      ],
      ...filtered.map((o) => [
        o.id,
        o.name,
        o.phone,
        serviceById(o.service).name,
        propertyNames[o.property],
        o.rooms,
        o.area,
        o.date,
        o.time,
        o.address,
        o.notes,
        statusById(o.status).label,
        o.adminNote,
        o.sample ? "Пример" : "Демо-заявка",
        o.quote?.total ?? "",
      ]),
    ];
    const safe = (value) => {
      const text = String(value ?? "");
      return /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
    };
    const blob = new Blob(
      [
        "\uFEFF" +
          rows
            .map((row) => row.map((v) => quote(safe(v))).join(";"))
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poryadok-заявки.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setToast("Заявки экспортированы в CSV");
    setUndoId(null);
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-icon">
            <Building2 size={19} />
          </span>
          <div>
            <strong>Порядок · демо</strong>
            <span>Рабочее пространство</span>
          </div>
        </div>
        <span className="sidebar-heading">УПРАВЛЕНИЕ</span>
        <nav aria-label="Навигация CRM">
          <button
            onClick={() => chooseView("orders")}
            className={view === "orders" ? "selected" : ""}
          >
            <Inbox size={19} /> Заявки{" "}
            <span>{orders.filter((x) => x.status === "new").length}</span>
          </button>
          <button
            onClick={() => chooseView("calendar")}
            className={view === "calendar" ? "selected" : ""}
          >
            <CalendarDays size={19} /> Календарь
          </button>
          <button
            onClick={() => chooseView("trash")}
            className={view === "trash" ? "selected" : ""}
          >
            <Trash2 size={19} /> Корзина <span>{deletedOrders.length}</span>
          </button>
          <button onClick={() => setTariffOpen(true)}>
            <SlidersHorizontal size={19} /> Тарифы
          </button>
          <button onClick={() => setAbout(true)}>
            <CircleHelp size={19} /> О демоверсии
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-demo">
            <span className="live-dot" />
            <strong>Режим демонстрации</strong>
            <p>
              Попробуйте оформить заявку
              <br />и обработать её здесь.
            </p>
            <Link href="/order">
              Оформить заявку <ArrowUpRight size={15} />
            </Link>
          </div>
          <Link href="/" className="sidebar-client-link">
            <ExternalLink size={16} /> Открыть сайт клиента
          </Link>
          <div className="admin-user">
            <span className="avatar">П</span>
            <div>
              <strong>Администратор</strong>
              <span>Демо-доступ</span>
            </div>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <span>Рабочее пространство</span>
            <ChevronRight size={13} />
            <strong>
              {view === "trash"
                ? "Корзина"
                : view === "orders"
                  ? "Заявки"
                  : "Календарь"}
            </strong>
          </div>
          <div className="admin-header-right">
            <span className="admin-date">
              {formatDate(today(), { weekday: "long" })}
            </span>
            <span className="avatar">П</span>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-title">
            <div>
              <span className="eyebrow">ВСЁ ПОД КОНТРОЛЕМ</span>
              <h1>
                {view === "trash"
                  ? "Корзина заявок"
                  : view === "orders"
                    ? "Заявки на уборку"
                    : "Календарь уборок"}
                <span className="title-dot">.</span>
              </h1>
              <p>
                {view === "trash"
                  ? "Удалённые обращения можно восстановить вместе с фотографиями."
                  : view === "orders"
                    ? "От первого обращения до чистого пространства."
                    : "Желаемые даты из заявок — всё в одном месте."}
              </p>
            </div>
            <Link href="/order" className="button button-small">
              <Plus size={17} /> Новая заявка
            </Link>
          </div>
          <div className="stats-grid">
            {stats.map(([label, num, Icon, f]) => (
              <button
                key={label}
                className={`stat-card ${f === "new" ? "stat-highlight" : ""}`}
                onClick={() => {
                  setFilter(f);
                  setView("orders");
                }}
              >
                <div>
                  <span>{label}</span>
                  <Icon size={18} />
                </div>
                <strong>{loading ? "—" : num}</strong>
                <span className="stat-caption">
                  {f === "all"
                    ? "В этом браузере"
                    : f === "new"
                      ? "Ожидают внимания"
                      : f === "processing"
                        ? "Уточняем детали"
                        : "Готовы к уборке"}{" "}
                  <ArrowUpRight size={14} />
                </span>
              </button>
            ))}
          </div>
          <div className="crm-notice">
            <CircleHelp size={16} />
            <span>
              Демо: заявки и фото хранятся в этом браузере. Карточки с отметкой
              «Пример» — вымышленные.
            </span>
            <button onClick={() => setTariffOpen(true)}>
              <SlidersHorizontal size={19} /> Тарифы
            </button>
            <button onClick={() => setAbout(true)}>
              Подробнее <ArrowUpRight size={13} />
            </button>
          </div>
          <section className="orders-panel">
            <div className="orders-panel-title">
              <h2>
                {view === "trash"
                  ? "Удалённые обращения"
                  : view === "orders"
                    ? "Все обращения"
                    : "Запланированные обращения"}{" "}
                <span>{filtered.length}</span>
              </h2>
              <button
                onClick={exportData}
                className="export-button"
                disabled={!filtered.length}
              >
                <Download size={16} />
                <span>Экспорт</span>
              </button>
            </div>
            <div className="filters-row">
              <div className="search-input">
                <Search size={17} />
                <input
                  aria-label="Поиск заявок"
                  placeholder="Имя, телефон или адрес"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="icon-button"
                    aria-label="Очистить поиск"
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="service-filter">
                <SlidersHorizontal size={16} />
                <select
                  aria-label="Фильтр по услуге"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="all">Все услуги</option>
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="status-tabs"
              role="group"
              aria-label="Фильтр по статусу"
            >
              {[{ id: "all", label: "Все" }, ...statuses].map((s) => (
                <button
                  className={filter === s.id ? "selected" : ""}
                  aria-pressed={filter === s.id}
                  key={s.id}
                  onClick={() => setFilter(s.id)}
                >
                  {s.label}
                  <span>
                    {s.id === "all"
                      ? currentOrders.length
                      : currentOrders.filter((x) => x.status === s.id).length}
                  </span>
                </button>
              ))}
            </div>
            {error ? (
              <div className="empty-state">
                <CircleHelp size={32} />
                <h3>Не удалось загрузить заявки</h3>
                <p>{error}</p>
                <button className="button button-small" onClick={refresh}>
                  <RotateCcw size={16} /> Повторить
                </button>
              </div>
            ) : loading ? (
              <div className="empty-state">
                <span className="spinner" />
                <p>Загружаем заявки…</p>
              </div>
            ) : !filtered.length ? (
              <div className="empty-state">
                <Inbox size={36} />
                <h3>
                  {view === "trash" ? "Корзина пуста" : "Заявок пока нет"}
                </h3>
                <p>
                  {view === "trash"
                    ? "Удалённые заявки появятся здесь. Их можно восстановить."
                    : "Попробуйте изменить фильтры или оформить новую заявку."}
                </p>
                <button
                  className="text-link"
                  onClick={() => {
                    setFilter("all");
                    setService("all");
                    setSearch("");
                  }}
                >
                  Сбросить фильтры <RotateCcw size={15} />
                </button>
              </div>
            ) : view !== "calendar" ? (
              <>
                <div className="desktop-orders">
                  <table>
                    <thead>
                      <tr>
                        <th>Клиент</th>
                        <th>Услуга / помещение</th>
                        <th>Желаемая дата</th>
                        <th>Статус</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <button
                              className="row-client"
                              onClick={() => setSelected(o.id)}
                            >
                              <span
                                className={`avatar ${o.sample ? "sample-avatar" : ""}`}
                              >
                                {o.name[0]}
                              </span>
                              <span>
                                <strong>{o.name}</strong>
                                <small>
                                  {o.id}{" "}
                                  <span
                                    className={
                                      o.sample ? "sample-label" : "own-label"
                                    }
                                  >
                                    {o.sample ? "Пример" : "С сайта"}
                                  </span>
                                </small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <strong>{serviceById(o.service).name}</strong>
                            <small>
                              {propertyNames[o.property]} · {o.rooms} комн. ·{" "}
                              {o.area} м²
                            </small>
                          </td>
                          <td>
                            <strong>{formatDate(o.date)}</strong>
                            <small>{o.time}</small>
                          </td>
                          <td>
                            <Status id={o.status} />
                          </td>
                          <td>
                            <button
                              className="icon-button"
                              aria-label={`Открыть заявку ${o.id}`}
                              onClick={() => setSelected(o.id)}
                            >
                              <ArrowUpRight size={19} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-orders">
                  {filtered.map((o) => (
                    <button
                      className="mobile-order-card"
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                    >
                      <div>
                        <span className="order-id">
                          {o.id}{" "}
                          <small>{o.sample ? "Пример" : "С сайта"}</small>
                        </span>
                        <Status id={o.status} />
                      </div>
                      <h3>
                        {o.name} <ArrowUpRight size={19} />
                      </h3>
                      <strong>{serviceById(o.service).name}</strong>
                      <p>
                        {propertyNames[o.property]} · {o.rooms} комн. · {o.area}{" "}
                        м²
                      </p>
                      <span className="mobile-order-date">
                        <CalendarDays size={14} />
                        {formatDate(o.date)} · {o.time}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="calendar-orders">
                {[...new Set(filtered.map((x) => x.date))]
                  .sort()
                  .map((date) => (
                    <div className="calendar-group" key={date}>
                      <div>
                        <strong>{localDate(date).getDate()}</strong>
                        <span>{formatDate(date, { weekday: "short" })}</span>
                      </div>
                      <section>
                        {filtered
                          .filter((x) => x.date === date)
                          .map((o) => (
                            <button
                              onClick={() => setSelected(o.id)}
                              key={o.id}
                            >
                              <span>
                                <strong>{o.name}</strong>
                                <small>
                                  {serviceById(o.service).name} · {o.time}
                                </small>
                              </span>
                              <Status id={o.status} />
                              <ArrowUpRight size={18} />
                            </button>
                          ))}
                      </section>
                    </div>
                  ))}
              </div>
            )}
            <div className="orders-panel-footer">
              <span>
                Показано {filtered.length} из {currentOrders.length} заявок
              </span>
              <span>
                <span className="live-dot" /> Изменения сохраняются
                автоматически после подтверждения
              </span>
            </div>
          </section>
          <div className="admin-mobile-nav">
            <button onClick={() => setTariffOpen(true)}>
              <SlidersHorizontal size={19} />
              Тарифы
            </button>
            <button
              className={view === "orders" ? "selected" : ""}
              onClick={() => chooseView("orders")}
            >
              <Inbox size={19} />
              Заявки
            </button>
            <button
              className={view === "calendar" ? "selected" : ""}
              onClick={() => chooseView("calendar")}
            >
              <CalendarDays size={19} />
              Календарь
            </button>
            <Link href="/">
              {" "}
              <Home size={19} />
              Клиент
            </Link>
            <button
              onClick={() => chooseView("trash")}
              className={view === "trash" ? "selected" : ""}
            >
              <Trash2 size={19} />
              Корзина
            </button>
          </div>
        </main>
      </div>
      {actual && (
        <OrderDetail
          key={actual.id}
          order={actual}
          onClose={() => {
            setSelected(null);
            history.replaceState({}, "", "/admin");
          }}
          onUpdate={change}
          onDelete={remove}
          onRestore={restore}
        />
      )}{" "}
      {tariffOpen && (
        <Modal
          onClose={() => setTariffOpen(false)}
          label="Настройка демо-тарифов"
          className="tariff-modal"
        >
          <TariffEditor onClose={() => setTariffOpen(false)} />
        </Modal>
      )}
      {about && <AboutDemo onClose={() => setAbout(false)} />}{" "}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          {undoId && (
            <button
              className="undo-delete"
              onClick={() =>
                restore(undoId).catch((e) =>
                  setToast(e.message || "Не удалось восстановить заявку"),
                )
              }
            >
              <RotateCcw size={14} /> Отменить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
function App() {
  const [route, setRoute] = useState(location.pathname);
  useEffect(() => {
    const pop = () => {
      setRoute(location.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  navigate = (url) => {
    history.pushState({}, "", url);
    setRoute(location.pathname);
    window.scrollTo(0, 0);
    if (location.hash)
      requestAnimationFrame(() =>
        document
          .querySelector(location.hash)
          ?.scrollIntoView({ behavior: "smooth" }),
      );
  };
  useEffect(() => {
    document.title =
      route === "/admin"
        ? "Порядок · CRM — заявки на уборку"
        : route === "/order"
          ? "Заказать уборку · Порядок"
          : "Порядок — чистота, с которой легко";
  }, [route]);
  return (
    <>
      <DemoBar admin={route === "/admin"} />
      {route === "/admin" ? (
        <Admin />
      ) : route === "/order" ? (
        <Order />
      ) : route === "/" ? (
        <Landing />
      ) : (
        <main className="not-found container">
          <Brand />
          <h1>
            Эта страница
            <br />
            куда-то пропала.
          </h1>
          <Link href="/" className="button">
            На главную <ArrowLeft size={16} />
          </Link>
        </main>
      )}
    </>
  );
}
const root =
  import.meta.hot?.data.root || createRoot(document.getElementById("root"));
root.render(<App />);
if (import.meta.hot) import.meta.hot.data.root = root;
