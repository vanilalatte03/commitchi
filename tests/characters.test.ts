import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCatalog, validateCharacterManifest } from "../src/characters";

test("validateCatalog rejects empty catalogs, non-increasing numbers, and duplicate ids", () => {
  assert.throws(() => validateCatalog({ characters: [] }), /characters must not be empty/);
  assert.throws(
    () =>
      validateCatalog({
        characters: [
          { number: 2, id: "yuki" },
          { number: 2, id: "nari" },
        ],
      }),
    /must be greater than the previous entry/
  );
  assert.throws(
    () =>
      validateCatalog({
        characters: [
          { number: 1, id: "yuki" },
          { number: 3, id: "yuki" },
        ],
      }),
    /duplicate character id "yuki"/
  );
});

test("validateCatalog allows permanent number gaps", () => {
  assert.deepEqual(
    validateCatalog({
      characters: [
        { number: 1, id: "yuki" },
        { number: 3, id: "nari" },
      ],
    }),
    {
      characters: [
        { number: 1, id: "yuki" },
        { number: 3, id: "nari" },
      ],
    }
  );
});

test("validateCharacterManifest accepts complete CC-BY-4.0 manifests", () => {
  assert.deepEqual(
    validateCharacterManifest(
      {
        id: "yuki",
        displayName: "Yuki",
        ghostName: "Ghost Yuki",
        author: "Commitchi",
        license: "CC-BY-4.0",
      },
      "manifest.json",
      "yuki"
    ),
    {
      id: "yuki",
      displayName: "Yuki",
      ghostName: "Ghost Yuki",
      author: "Commitchi",
      license: "CC-BY-4.0",
    }
  );
});

test("validateCharacterManifest rejects missing fields, bad ids, bad licenses, and id mismatches", () => {
  assert.throws(
    () =>
      validateCharacterManifest({
        id: "yuki",
        ghostName: "Ghost Yuki",
        author: "Commitchi",
        license: "CC-BY-4.0",
      }),
    /displayName must be a string/
  );
  assert.throws(
    () =>
      validateCharacterManifest({
        id: "Yuki",
        displayName: "Yuki",
        ghostName: "Ghost Yuki",
        author: "Commitchi",
        license: "CC-BY-4.0",
      }),
    /id must start with a lowercase letter/
  );
  assert.throws(
    () =>
      validateCharacterManifest({
        id: "yuki",
        displayName: "Yuki",
        ghostName: "Ghost Yuki",
        author: "Commitchi",
        license: "MIT",
      }),
    /license must be "CC-BY-4.0"/
  );
  assert.throws(
    () =>
      validateCharacterManifest(
        {
          id: "yuki",
          displayName: "Yuki",
          ghostName: "Ghost Yuki",
          author: "Commitchi",
          license: "CC-BY-4.0",
        },
        "manifest.json",
        "nari"
      ),
    /id must match folder name "nari"/
  );
});
