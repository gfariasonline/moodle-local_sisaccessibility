// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/preferences */
// Same order as configuration::COLOURS in PHP: the first saved colour tool wins if a stored state names several.
const COLOURS = ['monochrome', 'lowsaturation', 'highsaturation', 'highcontrast', 'lightcontrast', 'darkcontrast',
    'protanopia', 'deuteranopia', 'tritanopia'];
const TOOLS = ['fontsize', 'bold', 'lineheight', 'letterspacing', 'dyslexia', 'links', 'headings', ...COLOURS,
    'cursor', 'guide', 'animations', 'hideimages', 'imagetooltips', 'pausemedia', 'silencemedia'];
const PREFIX = 'local_sisaccessibility:v1:';
const RETENTION = 90 * 24 * 60 * 60 * 1000;

/**
 * Validate only known, enabled tools and make colour modes mutually exclusive.
 * @param {Object} input
 * @param {string[]} enabled
 */
export const normalise = (input, enabled) => {
    const state = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return state;
    }
    let colour = false;
    TOOLS.filter(tool => enabled.includes(tool)).forEach(tool => {
        if (tool === 'fontsize') {
            if (typeof input[tool] === 'number' && Number.isFinite(input[tool])) {
                state[tool] = Math.round(Math.max(1, Math.min(2, input[tool])) * 10) / 10;
            }
        } else if (input[tool] === true && (!COLOURS.includes(tool) || !colour)) {
            state[tool] = true;
            colour = colour || COLOURS.includes(tool);
        }
    });
    return state;
};
export const colourTools = COLOURS;

/**
 * Storage failures never prevent using the panel. No cookies or server writes.
 * @param {string} key
 * @param {string[]} tools
 * @param {boolean} persist
 * @param {Storage} storage
 */
export const createPreferences = (key, tools, persist, storage) => {
    let memory = {};
    const remove = name => {
        try {
            storage?.removeItem(name);
        } catch (error) { /* Storage may be denied. */ }
    };
    const load = () => {
        if (!persist) {
            return memory;
        }
        try {
            const raw = storage?.getItem(key);
            if (!raw) {
                return memory;
            }
            if (raw.length > 4096) {
                remove(key);
                return {};
            }
            const saved = JSON.parse(raw);
            if (saved.version !== 1 || !Number.isFinite(saved.expires) || saved.expires <= Date.now() ||
                    saved.expires > Date.now() + RETENTION) {
                remove(key);
                return {};
            }
            memory = normalise(saved.state, tools);
        } catch (error) { /* Retain in-memory changes if browser storage is denied. */ }
        return memory;
    };
    const save = input => {
        memory = normalise(input, tools);
        if (persist) {
            try {
                storage?.setItem(key, JSON.stringify({version: 1, expires: Date.now() + RETENTION, state: memory}));
            } catch (error) { /* Use memory. */ }
        }
        return memory;
    };
    const expired = name => {
        try {
            const raw = storage.getItem(name);
            return raw.length > 4096 || !(JSON.parse(raw).expires > Date.now());
        } catch (error) {
            return true;
        }
    };
    // Remove only expired plugin-owned keys; bounded to avoid an unbounded origin-wide scan.
    if (persist) {
        try {
            const stale = [];
            for (let i = 0; i < Math.min(storage?.length || 0, 200); i++) {
                const name = storage.key(i);
                if (name?.startsWith(PREFIX) && expired(name)) {
                    stale.push(name);
                }
            }
            stale.forEach(remove);
        } catch (error) { /* Storage enumeration is optional. */ }
    }
    return {load, save, reset: () => {
        memory = {};
        remove(key);
    }};
};
