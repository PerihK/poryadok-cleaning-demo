import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import React, { useState } from "react";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
const { render, cleanup, fireEvent } = await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");
const { default: PhoneInput } = await import("../src/PhoneInput.jsx");
afterEach(cleanup);
function Wrapper() {
  const [phone, setPhone] = useState("");
  return <PhoneInput value={phone} onChange={setPhone} />;
}
const expected = "+7 (900) 123-45-67";

test("typing an 8-prefixed number works and the country prefix stays fixed", async () => {
  const user = userEvent.setup({ document });
  const { getByLabelText } = render(<Wrapper />);
  const input = getByLabelText("Номер телефона");
  await user.click(input);
  await user.keyboard("89001234567");
  assert.equal(input.value, expected);
  input.setSelectionRange(0, 0);
  await user.keyboard("9");
  assert.equal(input.value, "+7 (990) 012-34-56");
});

test("typing and backspace preserve the actual phone digits and caret", async () => {
  const user = userEvent.setup({ document });
  const { getByLabelText } = render(<Wrapper />);
  const input = getByLabelText("Номер телефона");
  await user.click(input);
  await user.keyboard("9001234567");
  assert.equal(input.value, expected);
  await user.keyboard("{Backspace}");
  assert.equal(input.value, "+7 (900) 123-45-6");
  await user.keyboard("7");
  assert.equal(input.value, expected);
  input.setSelectionRange(8, 8);
  await user.keyboard("{Backspace}");
  await user.keyboard("0");
  assert.equal(input.value, expected);
});

test("pasting a number starting with 8 normalizes it to +7", async () => {
  const user = userEvent.setup({ document });
  const { getByLabelText } = render(<Wrapper />);
  const input = getByLabelText("Номер телефона");
  await user.click(input);
  input.setSelectionRange(0, input.value.length);
  await user.paste("8 (900) 123-45-67");
  assert.equal(input.value, expected);
  await user.keyboard("123");
  assert.equal(input.value, expected);
});

test("mobile beforeinput deletion works without a keydown event", async () => {
  const user = userEvent.setup({ document });
  const { getByLabelText } = render(<Wrapper />);
  const input = getByLabelText("Номер телефона");
  await user.click(input);
  input.setSelectionRange(0, input.value.length);
  await user.paste("+79001234567");
  input.setSelectionRange(input.value.length, input.value.length);
  fireEvent(
    input,
    new window.InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteContentBackward",
    }),
  );
  assert.equal(input.value, "+7 (900) 123-45-6");
});

test("pasting a complete number into the focused empty mask replaces its country prefix", async () => {
  const user = userEvent.setup({ document });
  const { getByLabelText } = render(<Wrapper />);
  const input = getByLabelText("Номер телефона");
  await user.click(input);
  await user.paste("8 (900) 123-45-67");
  assert.equal(input.value, expected);
});
