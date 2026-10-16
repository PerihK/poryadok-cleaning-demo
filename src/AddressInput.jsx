import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search, LoaderCircle } from "lucide-react";
import { suggestAddresses } from "./address-search.js";

export default function AddressInput({ value, onChange, error }) {
  const id = useId();
  const field = useRef(null);
  const pickedValue = useRef("");
  const blurTimer = useRef(null);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(-1);
  const open = focused && (busy || suggestions.length > 0 || !!message);
  useEffect(() => {
    const query = value.trim();
    setActive(-1);
    setMessage("");
    setSuggestions([]);
    if (!focused || query.length < 3 || query === pickedValue.current) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    let deadline;
    let timedOut = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      deadline = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 10000);
      try {
        const rows = await suggestAddresses(query.slice(0, 200), {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setSuggestions(rows);
        if (!rows.length)
          setMessage(
            "Не нашли адрес. Добавьте город и номер дома или введите адрес вручную.",
          );
      } catch (e) {
        if (timedOut || !controller.signal.aborted)
          setMessage(
            "Подсказки сейчас недоступны. Адрес можно ввести вручную.",
          );
      } finally {
        clearTimeout(deadline);
        if (timedOut || !controller.signal.aborted) setBusy(false);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      clearTimeout(deadline);
      controller.abort();
    };
  }, [value, focused]);
  useEffect(() => () => clearTimeout(blurTimer.current), []);
  const choose = (suggestion) => {
    pickedValue.current = suggestion.label;
    onChange(suggestion.label);
    setSuggestions([]);
    setMessage("");
    setActive(-1);
    field.current.focus();
  };
  return (
    <div className="address-combobox">
      <div className="address-input-wrap">
        <MapPin size={17} />
        <input
          ref={field}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-label="Адрес помещения"
          aria-invalid={!!error}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          placeholder="Начните с города или улицы"
          value={value}
          maxLength={300}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
              return;
            }
            if (!open || !suggestions.length) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const next =
                e.key === "ArrowDown"
                  ? (active + 1) % suggestions.length
                  : active <= 0
                    ? suggestions.length - 1
                    : active - 1;
              setActive(next);
              document
                .getElementById(`${id}-${next}`)
                ?.scrollIntoView({ block: "nearest" });
            }
            if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              choose(suggestions[active]);
            }
          }}
        />
        {busy && <LoaderCircle className="address-spinner" size={16} />}
      </div>
      {open && (
        <div className="address-dropdown">
          {busy && (
            <p className="address-message">
              <Search size={15} /> Ищем адрес…
            </p>
          )}
          <div role="listbox" id={`${id}-list`} aria-label="Подсказки адресов">
            {suggestions.map((s, i) => (
              <button
                type="button"
                role="option"
                aria-selected={active === i}
                id={`${id}-${i}`}
                key={s.label}
                className={active === i ? "active" : ""}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
              >
                <MapPin size={16} />
                <span>
                  <strong>{s.address}</strong>
                  <small>{s.region}</small>
                </span>
              </button>
            ))}
          </div>
          {message && <p className="address-message">{message}</p>}
          {!busy && (
            <a
              className="address-attribution"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              © OpenStreetMap
            </a>
          )}
        </div>
      )}
      <span className="field-hint">
        Выберите подсказку, затем добавьте квартиру или офис. Адрес можно ввести
        вручную.
      </span>
    </div>
  );
}
