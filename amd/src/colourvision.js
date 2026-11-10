// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/colourvision */

// The matrices live in one place only: the hidden SVG rendered by classes/local/colour_vision.php. This module
// reads them back, so the CSS filter and the re-tinted page backgrounds can never disagree.
export const colourVisionTools = ['protanopia', 'deuteranopia', 'tritanopia'];
export const colourVisionFilters = Object.fromEntries(colourVisionTools.map(tool => [tool, `url(#sis-a11y-${tool})`]));

/**
 * Read the 3x3 colour part of a filter's feColorMatrix.
 * @param {Document} doc
 * @param {string} tool
 * @return {number[][]|null} Rows of the matrix, or null when the page does not define this filter
 */
export const readMatrix = (doc, tool) => {
    const values = doc.querySelector(`#sis-a11y-filters #sis-a11y-${tool} feColorMatrix`)?.getAttribute('values');
    const numbers = (values || '').trim().split(/[\s,]+/).map(Number);
    if (numbers.length !== 20 || numbers.some(value => !Number.isFinite(value))) {
        return null;
    }
    return [0, 1, 2].map(row => numbers.slice(row * 5, row * 5 + 3));
};

const toLinear = value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};
const fromLinear = value => {
    const channel = Math.max(0, Math.min(1, value));
    return 255 * (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);
};

/**
 * Apply a matrix the way the browser does for feColorMatrix: in linear RGB.
 * @param {number[]} rgb Channels from 0 to 255
 * @param {number[][]|null} matrix
 * @return {number[]} Channels from 0 to 255
 */
export const applyMatrix = (rgb, matrix) => {
    if (!matrix) {
        return rgb;
    }
    const linear = rgb.map(toLinear);
    return matrix.map(row => fromLinear(row.reduce((sum, factor, index) => sum + factor * linear[index], 0)));
};
