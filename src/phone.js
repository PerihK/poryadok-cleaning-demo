export function nationalDigits(value) {
  const raw = String(value || "");
  let digits = raw.replace(/\D/g, "");
  if (
    raw.startsWith("+7") ||
    ((digits.length === 11 || digits.length === 1) && /^[78]/.test(digits))
  )
    digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function maskPhone(value) {
  if (!value) return "";
  const digits = nationalDigits(value);
  let result = "+7";
  if (digits.length) result += " (" + digits.slice(0, 3);
  if (digits.length >= 3) result += ")";
  if (digits.length > 3) result += " " + digits.slice(3, 6);
  if (digits.length > 6) result += "-" + digits.slice(6, 8);
  if (digits.length > 8) result += "-" + digits.slice(8, 10);
  return result;
}

export function phoneCaret(value, count) {
  if (!count) return Math.min(4, value.length);
  let digits = 0;
  for (let i = 3; i < value.length; i++) {
    if (/\d/.test(value[i]) && ++digits === count) {
      let cursor = i + 1;
      while (cursor < value.length && !/\d/.test(value[cursor])) cursor++;
      return cursor;
    }
  }
  return value.length;
}

export function deletePhoneDigit(value, start, end, direction) {
  if (start === 0 && end === value.length) return { value: "", caret: 0 };
  let left = Math.max(3, start),
    right = Math.max(left, end);
  if (start === end) {
    if (direction === "backward") {
      left--;
      while (left >= 3 && !/\d/.test(value[left])) left--;
      if (left < 3) return { value, caret: Math.min(4, value.length) };
      right = left + 1;
    } else {
      while (left < value.length && !/\d/.test(value[left])) left++;
      right = left + 1;
    }
  }
  const before = value.slice(3, left).replace(/\D/g, "").length;
  const next = maskPhone(value.slice(0, left) + value.slice(right));
  return { value: next, caret: phoneCaret(next, before) };
}
