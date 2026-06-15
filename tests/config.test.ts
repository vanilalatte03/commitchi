import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { DEFAULT_CONFIG, loadConfig } from "../src/config";
import { withTempDir, writeJson } from "./helpers";

test("loadConfig returns DEFAULT_CONFIG when the config file is missing", () => {
  withTempDir((dir) => {
    assert.deepEqual(loadConfig(join(dir, "missing.json")), DEFAULT_CONFIG);
  });
});

test("loadConfig accepts registered character ids", () => {
  withTempDir((dir) => {
    const path = join(dir, "config.json");
    writeJson(path, { character: "nari" });

    assert.equal(loadConfig(path).character, "nari");
  });
});

test("loadConfig rejects unknown, non-string, and empty character values", () => {
  withTempDir((dir) => {
    const unknown = join(dir, "unknown.json");
    writeJson(unknown, { character: "missing" });
    assert.throws(() => loadConfig(unknown), /character "missing" is not a registered character/);

    const nonString = join(dir, "non-string.json");
    writeJson(nonString, { character: 1 });
    assert.throws(() => loadConfig(nonString), /character must be a string/);

    const empty = join(dir, "empty.json");
    writeJson(empty, { character: "  " });
    assert.throws(() => loadConfig(empty), /character must not be empty/);
  });
});

test("loadConfig accepts legacy name as petName and rejects names over 24 chars", () => {
  withTempDir((dir) => {
    const legacy = join(dir, "legacy.json");
    writeJson(legacy, { name: "Legacy" });
    assert.equal(loadConfig(legacy).petName, "Legacy");

    const longName = join(dir, "long-name.json");
    writeJson(longName, { petName: "abcdefghijklmnopqrstuvwxy" });
    assert.throws(() => loadConfig(longName), /petName must be 24 characters or fewer/);
  });
});

test("loadConfig rejects invalid theme and language values", () => {
  withTempDir((dir) => {
    const theme = join(dir, "theme.json");
    writeJson(theme, { theme: "summer" });
    assert.throws(() => loadConfig(theme), /theme must be "winter"/);

    const language = join(dir, "language.json");
    writeJson(language, { language: "jp" });
    assert.throws(() => loadConfig(language), /language must be "ko" or "en"/);
  });
});

test("loadConfig validates economy and threshold numeric bounds", () => {
  withTempDir((dir) => {
    const cases: Array<[string, unknown, RegExp]> = [
      ["negative-feed.json", { economy: { feedPerContrib: -1 } }, /between 0 and 100/],
      ["large-start.json", { economy: { startFullness: 101 } }, /between 0 and 100/],
      ["fractional-neglect.json", { thresholds: { neglectDays: 1.5 } }, /must be an integer/],
      ["zero-neglect.json", { thresholds: { neglectDays: 0 } }, /between 1 and 365/],
      [
        "inverted-thresholds.json",
        { thresholds: { hungryFullness: 10, sickFullness: 11 } },
        /sickFullness must be less than or equal to hungryFullness/,
      ],
    ];

    for (const [fileName, body, pattern] of cases) {
      const path = join(dir, fileName);
      writeJson(path, body);
      assert.throws(() => loadConfig(path), pattern);
    }
  });
});
