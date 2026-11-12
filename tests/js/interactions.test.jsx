// @vitest-environment jsdom
import React, { act, useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import PlayerSearch from "../../src/components/PlayerSearch";
import MethodologyModal from "../../src/components/MethodologyModal";
import App from "../../src/App";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let host;
async function render(component) {
  host = document.createElement("div"); document.body.append(host);
  root = createRoot(host);
  await act(async () => { root.render(component); });
}
afterEach(() => { if (root) act(() => root.unmount()); root = null; host?.remove(); vi.unstubAllGlobals(); });
const key = (element, value, options = {}) => {
  const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options });
  act(() => element.dispatchEvent(event)); return event;
};
const inputText = (input, text) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
const players = [
  { id: 1, name: "Alpha", team: "AAA", pts: 10, ast: 3 },
  { id: 2, name: "Alpine", team: "BBB", pts: 12, ast: 4 },
];

test("search supports arrows and Enter, then closes after selection", async () => {
  const choose = vi.fn();
  await render(<PlayerSearch players={players} label="Choose player" onSelect={choose} />);
  const input = host.querySelector("input"); act(() => input.focus()); inputText(input, "Al");
  expect(input.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(2);
  expect(host.querySelector('[role="option"]').tabIndex).toBe(-1);
  key(input, "ArrowDown"); key(input, "Enter");
  expect(choose).toHaveBeenCalledWith(players[1]);
  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(host.querySelector('[role="listbox"]')).toBeNull();
});

test("zero-result popup is announced as open and closes on blur or Escape", async () => {
  await render(<><PlayerSearch players={players} label="Choose player" onSelect={() => {}} /><button>Outside</button></>);
  const input = host.querySelector("input"); act(() => input.focus()); inputText(input, "missing");
  expect(input.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelector('[role="status"]').textContent).toContain("No matching");
  act(() => host.querySelector("button").focus());
  expect(host.querySelector('[role="listbox"]')).toBeNull();
  act(() => input.focus()); key(input, "Escape");
  expect(input.value).toBe("");
});

test("methodology keeps Tab focus inside, restores focus on Escape, and releases background", async () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return <div className="app-shell"><header><button onClick={() => setOpen(true)}>Methodology</button></header>
      <main><button>Background</button></main><MethodologyModal open={open} onClose={() => setOpen(false)} /></div>;
  }
  await render(<StrictMode><Harness /></StrictMode>);
  const opener = host.querySelector("header button"); act(() => { opener.focus(); opener.click(); });
  const close = host.querySelector('[aria-label="Close methodology"]');
  expect(document.activeElement).toBe(close);
  expect(host.querySelector("main").hasAttribute("inert")).toBe(true);
  expect(key(close, "Tab").defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(close);
  expect(key(close, "Tab", { shiftKey: true }).defaultPrevented).toBe(true);
  key(close, "Escape");
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(opener);
  expect(host.querySelector("main").hasAttribute("inert")).toBe(false);
});

test("App offers recovery for insufficient data and renders after retry", async () => {
  const data = JSON.parse(readFileSync("public/players.json"));
  data.players = data.players.slice(0, 6);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ players: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => data }));
  await render(<App />);
  expect(host.querySelector('[role="alert"]').textContent).toContain("at least two players");
  await act(async () => { host.querySelector('[role="alert"] button').click(); });
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector("main")).not.toBeNull();
});
