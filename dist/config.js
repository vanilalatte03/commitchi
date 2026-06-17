"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.CONFIG_PATH = void 0;
exports.loadConfig = loadConfig;
const node_fs_1 = require("node:fs");
const characters_1 = require("./characters");
const sprites_1 = require("./sprites");
exports.CONFIG_PATH = "commitchi.config.json";
const DISPLAY_STAGE_VALUES = ["auto", "egg", "baby", "child", "teen", "adult"];
const STAGE_VALUES = ["egg", "baby", "child", "teen", "adult"];
exports.DEFAULT_CONFIG = {
    petName: "Mochi",
    character: sprites_1.DEFAULT_SPECIES,
    displayStage: "auto",
    language: "ko",
    theme: "dark",
    economy: {
        feedPerContrib: 12,
        decayPerDay: 22,
        happinessDecayPerDay: 8,
        staminaDecayPerDay: 8,
        startFullness: 60,
    },
    thresholds: {
        hungryFullness: 45,
        sickFullness: 15,
        sickStamina: 30,
        neglectDays: 4,
    },
};
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readSection(source, key) {
    if (!(key in source))
        return undefined;
    const value = source[key];
    if (!isRecord(value))
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be an object.`);
    return value;
}
function readPetName(source) {
    const key = "petName" in source ? "petName" : "name";
    if (!(key in source))
        return exports.DEFAULT_CONFIG.petName;
    const value = source[key];
    if (typeof value !== "string")
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be a string.`);
    const name = value.trim();
    if (!name)
        throw new Error(`${exports.CONFIG_PATH}: ${key} must not be empty.`);
    if (name.length > 24)
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be 24 characters or fewer.`);
    return name;
}
function readCharacterByNumber(value) {
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${exports.CONFIG_PATH}: character number must be a positive integer.`);
    }
    try {
        return (0, characters_1.getCharacterByNumber)(value).id;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("no character with number")) {
            throw new Error(`${exports.CONFIG_PATH}: character No.${value} is not in the catalog (use a dex number shown on the card).`);
        }
        throw error;
    }
}
function readCharacter(source) {
    if (!("character" in source))
        return exports.DEFAULT_CONFIG.character;
    const value = source.character;
    // A dex number (e.g. 3 or "3") selects the character at that catalog number — the
    // same number shown on the dex card, so it can be chosen without knowing the id.
    if (typeof value === "number")
        return readCharacterByNumber(value);
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        return readCharacterByNumber(Number.parseInt(value.trim(), 10));
    }
    if (typeof value !== "string") {
        throw new Error(`${exports.CONFIG_PATH}: character must be a string id or a dex number.`);
    }
    const character = value.trim();
    if (!character)
        throw new Error(`${exports.CONFIG_PATH}: character must not be empty.`);
    try {
        (0, characters_1.getCharacter)(character);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes(`unknown character "${character}"`)) {
            throw new Error(`${exports.CONFIG_PATH}: character "${character}" is not a registered character (see catalog.json).`);
        }
        throw error;
    }
    return character;
}
function readTheme(source) {
    if (!("theme" in source))
        return exports.DEFAULT_CONFIG.theme;
    if (source.theme !== "dark") {
        throw new Error(`${exports.CONFIG_PATH}: theme must be "dark".`);
    }
    return source.theme;
}
function readLanguage(source) {
    if (!("language" in source))
        return exports.DEFAULT_CONFIG.language;
    if (source.language !== "ko" && source.language !== "en") {
        throw new Error(`${exports.CONFIG_PATH}: language must be "ko" or "en".`);
    }
    return source.language;
}
function readDisplayStage(source) {
    if (!("displayStage" in source))
        return exports.DEFAULT_CONFIG.displayStage;
    const value = source.displayStage;
    if (value === "auto" || STAGE_VALUES.includes(value))
        return value;
    throw new Error(`${exports.CONFIG_PATH}: displayStage "${String(value)}" must be one of: ${DISPLAY_STAGE_VALUES.join(", ")}.`);
}
function readNumber(section, key, fallback, options) {
    if (!section || !(key in section))
        return fallback;
    const value = section[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be a finite number.`);
    }
    if (options.integer && !Number.isInteger(value)) {
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be an integer.`);
    }
    if (value < options.min || value > options.max) {
        throw new Error(`${exports.CONFIG_PATH}: ${key} must be between ${options.min} and ${options.max}.`);
    }
    return value;
}
function readEconomy(source) {
    const economy = readSection(source, "economy");
    return {
        feedPerContrib: readNumber(economy, "feedPerContrib", exports.DEFAULT_CONFIG.economy.feedPerContrib, {
            min: 0,
            max: 100,
        }),
        decayPerDay: readNumber(economy, "decayPerDay", exports.DEFAULT_CONFIG.economy.decayPerDay, {
            min: 0,
            max: 100,
        }),
        happinessDecayPerDay: readNumber(economy, "happinessDecayPerDay", exports.DEFAULT_CONFIG.economy.happinessDecayPerDay, {
            min: 0,
            max: 100,
        }),
        staminaDecayPerDay: readNumber(economy, "staminaDecayPerDay", exports.DEFAULT_CONFIG.economy.staminaDecayPerDay, {
            min: 0,
            max: 100,
        }),
        startFullness: readNumber(economy, "startFullness", exports.DEFAULT_CONFIG.economy.startFullness, {
            min: 0,
            max: 100,
        }),
    };
}
function readThresholds(source) {
    const thresholds = readSection(source, "thresholds");
    const result = {
        hungryFullness: readNumber(thresholds, "hungryFullness", exports.DEFAULT_CONFIG.thresholds.hungryFullness, { min: 0, max: 100 }),
        sickFullness: readNumber(thresholds, "sickFullness", exports.DEFAULT_CONFIG.thresholds.sickFullness, { min: 0, max: 100 }),
        sickStamina: readNumber(thresholds, "sickStamina", exports.DEFAULT_CONFIG.thresholds.sickStamina, { min: 0, max: 100 }),
        neglectDays: readNumber(thresholds, "neglectDays", exports.DEFAULT_CONFIG.thresholds.neglectDays, {
            min: 1,
            max: 365,
            integer: true,
        }),
    };
    if (result.sickFullness > result.hungryFullness) {
        throw new Error(`${exports.CONFIG_PATH}: sickFullness must be less than or equal to hungryFullness.`);
    }
    return result;
}
function loadConfig(path = exports.CONFIG_PATH) {
    if (!(0, node_fs_1.existsSync)(path))
        return exports.DEFAULT_CONFIG;
    const parsed = JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
    if (!isRecord(parsed))
        throw new Error(`${path}: root value must be an object.`);
    return {
        petName: readPetName(parsed),
        character: readCharacter(parsed),
        displayStage: readDisplayStage(parsed),
        language: readLanguage(parsed),
        theme: readTheme(parsed),
        economy: readEconomy(parsed),
        thresholds: readThresholds(parsed),
    };
}
