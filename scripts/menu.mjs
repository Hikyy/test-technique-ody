#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MAKEFILE = join(ROOT, "Makefile");

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
  clear: "\x1b[2J\x1b[H",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

function parseTargets() {
  const src = readFileSync(MAKEFILE, "utf8");
  const sections = [];
  let current = { title: "Général", items: [] };
  for (const raw of src.split("\n")) {
    const sec = raw.match(/^##@\s+(.*)$/);
    if (sec) {
      if (current.items.length) sections.push(current);
      current = { title: sec[1].trim(), items: [] };
      continue;
    }
    const t = raw.match(/^([a-zA-Z0-9_.-]+):.*?##\s+(.*)$/);
    if (t) {
      const [, name, desc] = t;
      if (name === "help" || name === "menu") continue;
      current.items.push({ name, desc });
    }
  }
  if (current.items.length) sections.push(current);
  return sections;
}

function flatten(sections) {
  const items = [];
  for (const s of sections) {
    items.push({ kind: "header", title: s.title });
    for (const it of s.items) items.push({ kind: "item", ...it });
  }
  return items;
}

function findFirstItem(items) {
  return items.findIndex((it) => it.kind === "item");
}

function moveCursor(items, cur, dir) {
  let i = cur;
  do {
    i = (i + dir + items.length) % items.length;
  } while (items[i].kind !== "item");
  return i;
}

function render(items, cursor) {
  const lines = [];
  lines.push(
    `${ANSI.bold}${ANSI.cyan}frm-stack — menu${ANSI.reset}  ${ANSI.dim}↑/↓ naviguer · enter exécuter · q quitter${ANSI.reset}`,
  );
  lines.push("");
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "header") {
      lines.push("");
      lines.push(`${ANSI.bold}${ANSI.yellow}${it.title}${ANSI.reset}`);
      continue;
    }
    const sel = i === cursor;
    const arrow = sel ? `${ANSI.green}❯${ANSI.reset} ` : "  ";
    const name = sel
      ? `${ANSI.bold}${ANSI.green}${it.name.padEnd(22)}${ANSI.reset}`
      : `${ANSI.green}${it.name.padEnd(22)}${ANSI.reset}`;
    const desc = sel ? `${ANSI.bold}${it.desc}${ANSI.reset}` : `${ANSI.dim}${it.desc}${ANSI.reset}`;
    lines.push(`${arrow}${name}  ${desc}`);
  }
  return lines.join("\n");
}

async function main() {
  const sections = parseTargets();
  if (!sections.length) {
    console.error("Aucune cible trouvée dans le Makefile.");
    process.exit(1);
  }
  const items = flatten(sections);
  let cursor = findFirstItem(items);

  if (!process.stdin.isTTY) {
    console.error("Le menu interactif requiert un TTY.");
    process.exit(1);
  }

  process.stdout.write(ANSI.hide);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  const cleanup = () => {
    process.stdout.write(ANSI.show);
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
  };

  const draw = () => {
    process.stdout.write(ANSI.clear);
    process.stdout.write(render(items, cursor) + "\n");
  };
  draw();

  process.stdin.on("data", (key) => {
    if (key === "" || key === "q" || key === "") {
      cleanup();
      process.stdout.write("\nAnnulé.\n");
      process.exit(0);
    }
    if (key === "\r" || key === "\n") {
      const sel = items[cursor];
      cleanup();
      process.stdout.write(`\n${ANSI.bold}${ANSI.green}❯ make ${sel.name}${ANSI.reset}\n\n`);
      const child = spawn("make", [sel.name], { stdio: "inherit", cwd: ROOT });
      child.on("exit", (code) => process.exit(code ?? 0));
      return;
    }
    if (key === "[A" || key === "k") {
      cursor = moveCursor(items, cursor, -1);
      draw();
    } else if (key === "[B" || key === "j") {
      cursor = moveCursor(items, cursor, 1);
      draw();
    } else if (key === "[H" || key === "g") {
      cursor = findFirstItem(items);
      draw();
    } else if (key === "[F" || key === "G") {
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].kind === "item") {
          cursor = i;
          break;
        }
      }
      draw();
    }
  });
}

main().catch((e) => {
  process.stdout.write(ANSI.show);
  console.error(e);
  process.exit(1);
});
