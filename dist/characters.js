"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHARACTER_MANIFEST_FILE = exports.CATALOG_PATH = void 0;
exports.validateCharacterManifest = validateCharacterManifest;
exports.validateCatalog = validateCatalog;
exports.listCharacters = listCharacters;
exports.getCharacter = getCharacter;
exports.getCharacterByNumber = getCharacterByNumber;
exports.getCharacterSpriteDir = getCharacterSpriteDir;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const ENGINE_ROOT = process.env.COMMITCHI_HOME ?? process.cwd();
const SPRITE_ROOT = (0, node_path_1.join)(ENGINE_ROOT, "assets", "sprites");
exports.CATALOG_PATH = (0, node_path_1.join)(ENGINE_ROOT, "catalog.json");
exports.CHARACTER_MANIFEST_FILE = "character.json";
const CHARACTER_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const CHARACTER_LICENSE = "CC-BY-4.0";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readJson(path) {
    if (!(0, node_fs_1.existsSync)(path))
        throw new Error(`${path}: file is required.`);
    try {
        return JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`${path}: invalid JSON (${error.message}).`);
        }
        throw error;
    }
}
function readRequiredString(source, path, key) {
    const value = source[key];
    if (typeof value !== "string")
        throw new Error(`${path}: ${key} must be a string.`);
    const trimmed = value.trim();
    if (!trimmed)
        throw new Error(`${path}: ${key} must not be empty.`);
    if (trimmed.length > 64)
        throw new Error(`${path}: ${key} must be 64 characters or fewer.`);
    return trimmed;
}
function readCharacterId(source, path) {
    const id = readRequiredString(source, path, "id");
    if (!CHARACTER_ID_PATTERN.test(id)) {
        throw new Error(`${path}: id must start with a lowercase letter and contain only lowercase letters, numbers, or hyphens.`);
    }
    return id;
}
function readLicense(source, path) {
    const license = readRequiredString(source, path, "license");
    if (license !== CHARACTER_LICENSE) {
        throw new Error(`${path}: license must be "${CHARACTER_LICENSE}".`);
    }
    return license;
}
function validateCharacterManifest(value, path = exports.CHARACTER_MANIFEST_FILE, expectedId) {
    if (!isRecord(value))
        throw new Error(`${path}: root value must be an object.`);
    const id = readCharacterId(value, path);
    if (expectedId && id !== expectedId) {
        throw new Error(`${path}: id must match folder name "${expectedId}".`);
    }
    return {
        id,
        displayName: readRequiredString(value, path, "displayName"),
        ghostName: readRequiredString(value, path, "ghostName"),
        author: readRequiredString(value, path, "author"),
        license: readLicense(value, path),
    };
}
function readCatalogEntry(value, path, index) {
    const entryPath = `${path}: characters[${index}]`;
    if (!isRecord(value))
        throw new Error(`${entryPath} must be an object.`);
    const number = value.number;
    if (typeof number !== "number" || !Number.isInteger(number) || number < 1) {
        throw new Error(`${entryPath}.number must be a positive integer.`);
    }
    return {
        number,
        id: readCharacterId(value, `${entryPath}.id`),
    };
}
function validateCatalog(value, path = exports.CATALOG_PATH) {
    if (!isRecord(value))
        throw new Error(`${path}: root value must be an object.`);
    const characters = value.characters;
    if (!Array.isArray(characters))
        throw new Error(`${path}: characters must be an array.`);
    if (characters.length === 0)
        throw new Error(`${path}: characters must not be empty.`);
    const ids = new Set();
    let prevNumber = 0;
    const entries = characters.map((entry, index) => {
        const parsed = readCatalogEntry(entry, path, index);
        // Numbers must strictly increase: gaps are allowed (a retired number leaves a
        // permanent gap and is never reused — see MODERATION.md), but order/uniqueness hold.
        if (parsed.number <= prevNumber) {
            throw new Error(`${path}: characters[${index}].number (${parsed.number}) must be greater than the previous entry (${prevNumber}); numbers are ordered, unique, and never reused.`);
        }
        prevNumber = parsed.number;
        if (ids.has(parsed.id))
            throw new Error(`${path}: duplicate character id "${parsed.id}".`);
        ids.add(parsed.id);
        return parsed;
    });
    return { characters: entries };
}
function loadCatalog(path = exports.CATALOG_PATH) {
    return validateCatalog(readJson(path), path);
}
function discoverManifestIds() {
    if (!(0, node_fs_1.existsSync)(SPRITE_ROOT))
        return [];
    return (0, node_fs_1.readdirSync)(SPRITE_ROOT)
        .filter((id) => {
        const spriteDir = (0, node_path_1.join)(SPRITE_ROOT, id);
        return (0, node_fs_1.statSync)(spriteDir).isDirectory() && (0, node_fs_1.existsSync)((0, node_path_1.join)(spriteDir, exports.CHARACTER_MANIFEST_FILE));
    })
        .sort();
}
function loadCharacter(entry) {
    const spriteDir = (0, node_path_1.join)(SPRITE_ROOT, entry.id);
    if (!(0, node_fs_1.existsSync)(spriteDir) || !(0, node_fs_1.statSync)(spriteDir).isDirectory()) {
        throw new Error(`${exports.CATALOG_PATH}: character "${entry.id}" must map to ${spriteDir}.`);
    }
    const manifestPath = (0, node_path_1.join)(spriteDir, exports.CHARACTER_MANIFEST_FILE);
    const manifest = validateCharacterManifest(readJson(manifestPath), manifestPath, entry.id);
    return {
        number: entry.number,
        id: manifest.id,
        displayName: manifest.displayName,
        ghostName: manifest.ghostName,
        author: manifest.author,
        license: manifest.license,
        spriteDir,
        manifest,
    };
}
function loadCharacterRegistry() {
    const catalog = loadCatalog();
    const catalogIds = new Set(catalog.characters.map((entry) => entry.id));
    for (const manifestId of discoverManifestIds()) {
        if (!catalogIds.has(manifestId)) {
            throw new Error(`${exports.CATALOG_PATH}: assets/sprites/${manifestId}/${exports.CHARACTER_MANIFEST_FILE} is missing a catalog entry.`);
        }
    }
    return new Map(catalog.characters.map((entry) => [entry.id, loadCharacter(entry)]));
}
let registryCache = null;
function getRegistry() {
    registryCache ??= loadCharacterRegistry();
    return registryCache;
}
function listCharacters() {
    return [...getRegistry().values()];
}
function getCharacter(id) {
    const character = getRegistry().get(id);
    if (!character)
        throw new Error(`${exports.CATALOG_PATH}: unknown character "${id}".`);
    return character;
}
function getCharacterByNumber(number) {
    for (const character of getRegistry().values()) {
        if (character.number === number)
            return character;
    }
    throw new Error(`${exports.CATALOG_PATH}: no character with number ${number}.`);
}
function getCharacterSpriteDir(id) {
    return getCharacter(id).spriteDir;
}
