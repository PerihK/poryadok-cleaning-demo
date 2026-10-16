import { useEffect, useLayoutEffect, useRef } from "react";
import {
  maskPhone,
  nationalDigits,
  phoneCaret,
  deletePhoneDigit,
} from "./phone.js";

export default function PhoneInput({ value, onChange, error }) {
  const input = useRef(null);
  const pendingCaret = useRef(null);
  const applyDeletion = (event, direction) => {
    const field = input.current;
    const result = deletePhoneDigit(
      field.value,
      field.selectionStart,
      field.selectionEnd,
      direction,
    );
    event.preventDefault();
    pendingCaret.current = result.caret;
    onChange(result.value);
  };
  useEffect(() => {
    const field = input.current;
    const beforeInput = (event) => {
      if (event.inputType === "deleteContentBackward")
        applyDeletion(event, "backward");
      if (event.inputType === "deleteContentForward")
        applyDeletion(event, "forward");
      if (
        event.inputType === "insertText" &&
        field.selectionStart === field.selectionEnd &&
        field.selectionStart < 3 &&
        field.value.startsWith("+7")
      ) {
        const position = Math.min(4, field.value.length);
        field.setSelectionRange(position, position);
      }
    };
    field.addEventListener("beforeinput", beforeInput);
    return () => field.removeEventListener("beforeinput", beforeInput);
  }, [onChange]);
  useLayoutEffect(() => {
    if (
      pendingCaret.current !== null &&
      document.activeElement === input.current
    ) {
      input.current.setSelectionRange(
        pendingCaret.current,
        pendingCaret.current,
      );
      pendingCaret.current = null;
    }
  });
  return (
    <input
      ref={input}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      aria-label="Номер телефона"
      aria-invalid={!!error}
      placeholder="+7 (___) ___-__-__"
      value={maskPhone(value)}
      onPaste={(event) => {
        const pasted = event.clipboardData.getData("text");
        const digits = pasted.replace(/\D/g, "");
        const field = event.currentTarget;
        const wholeNumber = /^(?:[78]\d{10}|\d{10})$/.test(digits);
        const replacesAll =
          field.selectionStart === 0 &&
          field.selectionEnd === field.value.length;
        if (
          wholeNumber &&
          (!nationalDigits(value) || replacesAll || digits.length === 11)
        ) {
          event.preventDefault();
          const next = maskPhone(pasted);
          pendingCaret.current = next.length;
          onChange(next);
        }
      }}
      onFocus={() => {
        if (!value) onChange("+7");
        else if (maskPhone(value) !== value) onChange(maskPhone(value));
      }}
      onKeyDown={(event) => {
        if (
          /^\d$/.test(event.key) &&
          event.currentTarget.selectionStart ===
            event.currentTarget.selectionEnd &&
          event.currentTarget.selectionStart < 3 &&
          event.currentTarget.value.startsWith("+7")
        ) {
          const position = Math.min(4, event.currentTarget.value.length);
          event.currentTarget.setSelectionRange(position, position);
        }
        if (event.key === "Backspace") applyDeletion(event, "backward");
        if (event.key === "Delete") applyDeletion(event, "forward");
      }}
      onChange={(event) => {
        const raw = event.target.value;
        const caret = event.target.selectionStart;
        const digits = raw.replace(/\D/g, "");
        const prefix =
          raw.startsWith("+7") ||
          ((digits.length === 11 || digits.length === 1) &&
            /^[78]/.test(digits));
        const before = Math.max(
          0,
          raw.slice(0, caret).replace(/\D/g, "").length - (prefix ? 1 : 0),
        );
        const firstCountryDigit =
          !nationalDigits(value) && /^[78]$/.test(nationalDigits(raw));
        const next = firstCountryDigit ? "+7" : maskPhone(raw);
        pendingCaret.current = phoneCaret(
          next,
          Math.min(before, nationalDigits(next).length),
        );
        onChange(next);
      }}
    />
  );
}
