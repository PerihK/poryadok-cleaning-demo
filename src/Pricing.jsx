import React, { useEffect, useState } from "react";
import { ArrowUpRight, Check, RotateCcw, X } from "lucide-react";
import {
  defaultTariffs,
  extraServices,
  money,
  validateTariffs,
} from "./pricing.js";
import { getTariffs, saveTariffs } from "./db.js";
import { services } from "./data.js";

export function useTariffs() {
  const [tariffs, setTariffs] = useState(defaultTariffs);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const read = () =>
      getTariffs()
        .then((value) => {
          if (alive) {
            setTariffs(value);
            setReady(true);
            setError("");
          }
        })
        .catch(() => {
          if (alive)
            setError("Не удалось загрузить демо-тарифы. Обновите страницу.");
        });
    read();
    window.addEventListener("poryadok-data", read);
    return () => {
      alive = false;
      window.removeEventListener("poryadok-data", read);
    };
  }, []);
  return { tariffs, ready, error };
}

export function PriceBreakdown({ quote, compact = false }) {
  return (
    <div className={`price-breakdown ${compact ? "price-compact" : ""}`}>
      <span className="eyebrow">ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ</span>
      <div className="price-total" aria-live="polite" aria-atomic="true">
        {quote ? (
          <>
            {money(quote.total)}
            <span>за одну уборку</span>
          </>
        ) : (
          <span className="price-empty">
            Укажите площадь
            <br />и выберите услуги
          </span>
        )}
      </div>
      {quote && (
        <dl className="price-lines">
          <div>
            <dt>
              {quote.area} м² × {money(quote.rate)}
            </dt>
            <dd>{money(quote.areaAmount)}</dd>
          </div>
          {quote.minimumApplied && (
            <div>
              <dt>До минимальной стоимости</dt>
              <dd>+ {money(quote.baseAmount - quote.areaAmount)}</dd>
            </div>
          )}
          {quote.extras.map((item) => (
            <div key={item.id}>
              <dt>
                {item.label}
                <small>
                  {item.quantity} {item.unit} × {money(item.rate)}
                </small>
              </dt>
              <dd>{money(item.amount)}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="price-disclaimer">
        Демо-тарифы. Это примерный расчёт, а не окончательная цена. Итог зависит
        от состояния помещения и согласовывается отдельно.
      </p>
    </div>
  );
}

export function ExtraOptions({ form, tariffs, onChange, error }) {
  const toggle = (item) =>
    onChange({
      extras: form.extras.includes(item.name)
        ? form.extras.filter((name) => name !== item.name)
        : [...form.extras, item.name],
    });
  return (
    <div className="extra-calculator">
      {extraServices.map((item) => {
        const selected = form.extras.includes(item.name);
        return (
          <div
            key={item.id}
            className={`extra-line ${selected ? "selected" : ""}`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(item)}
            >
              <span className="extra-check">
                {selected && <Check size={14} />}
              </span>
              <span>
                {item.name}
                <small>
                  {money(tariffs.extras[item.id])} /{" "}
                  {item.unit === "м²"
                    ? "м²"
                    : item.id === "windows"
                      ? "створка"
                      : item.id === "cabinets"
                        ? "секция"
                        : "прибор"}
                </small>
              </span>
            </button>
            {selected && (
              <label className="extra-quantity">
                <span>{item.hint}</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  aria-label={item.hint}
                  value={form.extraQuantities?.[item.id] ?? 1}
                  aria-invalid={!!error}
                  onChange={(event) =>
                    onChange({
                      extraQuantities: {
                        ...form.extraQuantities,
                        [item.id]: event.target.value,
                      },
                    })
                  }
                />
                <span>{item.unit}</span>
              </label>
            )}
          </div>
        );
      })}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TariffEditor({ onClose }) {
  const { tariffs, ready, error: loadError } = useTariffs();
  const [draft, setDraft] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (ready && !draft) setDraft(structuredClone(tariffs));
  }, [ready, tariffs, draft]);
  const edit = (update) => {
    setDraft(update);
    setFeedback("");
    setError("");
  };
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setFeedback("");
    setBusy(true);
    try {
      validateTariffs(draft);
      const saved = await saveTariffs(draft);
      setDraft(saved);
      setFeedback(
        "Тарифы сохранены. Новые заявки используют обновлённый расчёт.",
      );
    } catch (e) {
      setError(e.message || "Не удалось сохранить тарифы");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="detail-header">
        <div>
          <span className="eyebrow">НАСТРОЙКИ ДЕМОВЕРСИИ</span>
          <h2>Тарифы</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Закрыть тарифы"
        >
          <X />
        </button>
      </div>
      <form className="tariff-form" onSubmit={save}>
        <div className="tariff-scroll">
          <p className="tariff-intro">
            Попробуйте свой сценарий ценообразования. Настройки действуют в этом
            браузере. Расчёты в уже созданных заявках сохраняются.
          </p>
          {loadError && (
            <p className="error-banner" role="alert">
              {loadError}
            </p>
          )}
          {!draft ? (
            <p>Загружаем тарифы…</p>
          ) : (
            <>
              <div className="tariff-heading">
                <span>Вид уборки</span>
                <span>₽ / м²</span>
                <span>Минимум, ₽</span>
              </div>
              {services.map((service) => (
                <div className="tariff-row" key={service.id}>
                  <strong>{service.name}</strong>
                  {["rate", "minimum"].map((key) => (
                    <input
                      key={key}
                      type="number"
                      required
                      min={key === "rate" ? 1 : 0}
                      max={key === "rate" ? 100000 : 1000000}
                      step="1"
                      inputMode="numeric"
                      aria-label={`${service.name}: ${key === "rate" ? "цена за м²" : "минимальная стоимость"}`}
                      value={draft.services[service.id][key]}
                      onChange={(e) =>
                        edit({
                          ...draft,
                          services: {
                            ...draft.services,
                            [service.id]: {
                              ...draft.services[service.id],
                              [key]:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  ))}
                </div>
              ))}
              <h3>Дополнительные услуги</h3>
              {extraServices.map((item) => (
                <label className="tariff-extra" key={item.id}>
                  <span>
                    {item.name}
                    <small>
                      ₽ /{" "}
                      {item.id === "windows"
                        ? "створка"
                        : item.id === "cabinets"
                          ? "секция"
                          : item.id === "appliances"
                            ? "прибор"
                            : "м²"}
                    </small>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    required
                    inputMode="numeric"
                    aria-label={`${item.name}: тариф`}
                    value={draft.extras[item.id]}
                    onChange={(e) =>
                      edit({
                        ...draft,
                        extras: {
                          ...draft.extras,
                          [item.id]:
                            e.target.value === "" ? "" : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
              <div className="tariff-formula">
                Расчёт: площадь × тариф, но не меньше минимальной стоимости,
                плюс выбранные дополнительные услуги. Тип помещения и
                периодичность сами по себе не меняют цену.
              </div>
            </>
          )}
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          {feedback && (
            <p className="tariff-feedback" role="status">
              <Check size={17} />
              {feedback}
            </p>
          )}
        </div>
        <div className="tariff-footer">
          <button
            type="button"
            className="text-link"
            disabled={!draft || busy}
            onClick={() => edit(structuredClone(defaultTariffs))}
          >
            <RotateCcw size={15} /> По умолчанию
          </button>
          <button className="button button-small" disabled={!draft || busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </>
  );
}
