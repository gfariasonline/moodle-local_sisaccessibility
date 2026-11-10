// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/effects */
import {textSelector, iconSelector, textStyles, highlightStyles, filters as siennaFilters, contrastStyles}
    from 'local_sisaccessibility/sienna';
import {colourVisionFilters, readMatrix, applyMatrix} from 'local_sisaccessibility/colourvision';

const filters = {...siennaFilters, ...colourVisionFilters};

// Every sis-a11y UI node (root, guide, structure panel, aids). html carries state classes, so it and body are not UI.
const WIDGET = '[id^="sis-a11y"],:not(html):not(body)[class*="sis-a11y"]';
// Rich editors keep their own colours and fixed/fullscreen layers: never styled, never wrapped by a filter.
const EDITORS = '[contenteditable]:not([contenteditable="false"]),.editor_atto,.tox,.mce-container,.CodeMirror,.ace_editor';
const EXCLUDE = WIDGET + ',svg,math,mjx-container,.MathJax,.MathJax_Display,textarea,input,select,iframe,' + EDITORS + ',' +
    iconSelector + ',.fas,.far,.fab,[class^="fa-"],[class*=" fa-"]';
const ICON_FONT = /awesome|glyphicon|material|ionicons|iconfont|fontello|bootstrap-icons|symbols/i;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'HEAD', 'TITLE', 'BASE', 'BR', 'OPTION']);

/**
 * Page backgrounds cannot carry a filter (it would become the containing block of fixed UI), so they are re-tinted.
 * @param {number[]} root0
 * @param {number} root0."0"
 * @param {number} root0."1"
 * @param {number} root0."2"
 * @param {number} s
 */
const saturate = ([r, g, b], s) => [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
];
const TINT = {
    monochrome: rgb => saturate(rgb, 0),
    lowsaturation: rgb => saturate(rgb, 0.5),
    highsaturation: rgb => saturate(rgb, 2),
    highcontrast: rgb => rgb.map(value => 1.25 * (value - 127.5) + 127.5),
};
const parseColour = value => {
    const match = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(value || '');
    if (!match) {
        return null;
    }
    let alpha = 1;
    if (match[4] !== undefined) {
        alpha = parseFloat(match[4]);
        if (match[4].endsWith('%')) {
            alpha /= 100;
        }
    }
    return {rgb: [match[1], match[2], match[3]].map(Number), alpha};
};
const isPainted = value => {
    const colour = parseColour(value);
    return colour ? colour.alpha > 0 : !!value && value !== 'transparent';
};
const hasText = el => [...el.childNodes].some(node => node.nodeType === 3 && /\S/.test(node.textContent));

/**
 * Reversible styles, measured before writing, with incremental AJAX processing.
 * @param {Document} doc
 */
export const createEffects = (doc = document) => {
    const win = doc.defaultView;
    const originals = new Map();
    let styled = new WeakSet();
    let state = {};
    let observer;
    let guide;
    let guideCentre = 0;
    const excluded = element => !!element.closest(EXCLUDE);
    const hasFilter = element => !!originals.get(element)?.properties.has('filter');
    const restoreElement = (record, element) => {
        if (element.getAttribute('style') === record.lastStyle) {
            if (record.originalStyle === null) {
                element.removeAttribute('style');
            } else {
                element.setAttribute('style', record.originalStyle);
            }
            return;
        }
        record.properties.forEach((value, property) => {
            if (value.value) {
                element.style.setProperty(property, value.value, value.priority);
            } else {
                element.style.removeProperty(property);
            }
        });
        if (!record.hadStyle && !element.getAttribute('style')) {
            element.removeAttribute('style');
        }
    };
    const restore = () => {
        originals.forEach(restoreElement);
        originals.clear();
        styled = new WeakSet();
    };
    const write = (element, property, value) => {
        if (!originals.has(element)) {
            originals.set(element, {hadStyle: element.hasAttribute('style'),
                originalStyle: element.getAttribute('style'), properties: new Map()});
        }
        const record = originals.get(element);
        if (!record.properties.has(property)) {
            record.properties.set(property, {value: element.style.getPropertyValue(property),
                priority: element.style.getPropertyPriority(property)});
        }
        element.style.setProperty(property, value, 'important');
        record.lastStyle = element.getAttribute('style');
    };
    /**
     * Undo one written property, keeping every other effect, and drop the record once nothing is left.
     * @param {Element} element
     * @param {string} property
     */
    const unwrite = (element, property) => {
        const record = originals.get(element);
        const saved = record?.properties.get(property);
        if (!saved) {
            return;
        }
        const untouched = element.getAttribute('style') === record.lastStyle;
        if (saved.value) {
            element.style.setProperty(property, saved.value, saved.priority);
        } else {
            element.style.removeProperty(property);
        }
        record.properties.delete(property);
        if (record.properties.size) {
            record.lastStyle = element.getAttribute('style');
            return;
        }
        originals.delete(element);
        if (untouched && record.originalStyle !== null) {
            element.setAttribute('style', record.originalStyle);
        } else if (!record.hadStyle && !element.getAttribute('style')) {
            element.removeAttribute('style');
        }
    };
    const filterAncestor = element => {
        for (let el = element.parentElement; el; el = el.parentElement) {
            if (hasFilter(el)) {
                return el;
            }
        }
        return null;
    };
    /**
     * Pick the top-level visual blocks that can safely carry a filter. A filter makes its element the containing block of
     * fixed descendants, so any block holding fixed UI (navbar, drawers, the widget, modals) is descended instead; fixed
     * blocks without fixed descendants carry the filter themselves.
     * @param {Document|Element} root
     * @param {Element[]} scope
     * @param {Map} info
     */
    const filterTargets = (root, scope, info) => {
        const containers = new Set();
        scope.filter(el => info.get(el).position === 'fixed' || el.matches(WIDGET + ',' + EDITORS)).forEach(hazard => {
            for (let el = hazard.parentElement; el && !containers.has(el); el = el.parentElement) {
                containers.add(el);
            }
        });
        const targets = [];
        const tinted = [];
        const visit = el => {
            if (!info.has(el) || el.matches(WIDGET + ',' + EDITORS) || hasFilter(el)) {
                return;
            }
            if (el === doc.documentElement || el === doc.body || containers.has(el)) {
                tinted.push(el);
                [...el.children].forEach(visit);
            } else {
                targets.push(el);
            }
        };
        if (root.nodeType === 9) {
            tinted.push(doc.documentElement);
            visit(doc.body);
        } else if (root.nodeType === 1 && !filterAncestor(root)) {
            visit(root);
        }
        return {targets, tinted};
    };
    const hazardIn = element => [element, ...element.querySelectorAll('*')].some(el => !SKIP_TAGS.has(el.tagName) &&
        (el.matches(WIDGET + ',' + EDITORS) || win.getComputedStyle(el).position === 'fixed'));
    const decorate = (root, mode = 'all') => {
        const scope = [...(root.nodeType === 1 ? [root] : []), ...root.querySelectorAll('*')]
            .filter(el => !SKIP_TAGS.has(el.tagName) && (!el.closest(WIDGET) || el.matches(WIDGET)));
        // Unscale ancestors of newly inserted content while measuring its natural size.
        const ancestors = [];
        if (state.fontsize > 1 && root.nodeType === 1 && mode !== 'filter') {
            for (let el = root.parentElement; el; el = el.parentElement) {
                const original = originals.get(el)?.properties.get('font-size');
                if (original) {
                    ancestors.push([el, el.style.getPropertyValue('font-size'), el.style.getPropertyPriority('font-size')]);
                    if (original.value) {
                        el.style.setProperty('font-size', original.value, original.priority);
                    } else {
                        el.style.removeProperty('font-size');
                    }
                }
            }
        }
        // Snapshot computed values for the whole batch before modifying anything.
        const info = new Map(scope.map(el => {
            const computed = win.getComputedStyle(el);
            return [el, {position: computed.position, size: parseFloat(computed.fontSize), family: computed.fontFamily,
                background: computed.backgroundColor, image: computed.backgroundImage, filter: computed.filter}];
        }));
        ancestors.forEach(([el, value, priority]) => el.style.setProperty('font-size', value, priority));
        const contrast = Object.keys(contrastStyles).find(tool => state[tool]);
        // A colour-vision filter needs its SVG definition on the page; referencing a missing one could hide content.
        const filter = Object.keys(filters).find(tool => state[tool] && (!colourVisionFilters[tool] || readMatrix(doc, tool)));
        const {targets, tinted} = filter && mode !== 'text' ? filterTargets(root, scope, info) : {targets: [], tinted: []};
        scope.forEach(element => {
            if (mode === 'filter' || excluded(element)) {
                return;
            }
            const data = info.get(element);
            const isText = (element.matches(textSelector) || hasText(element)) && !ICON_FONT.test(data.family);
            if (isText && !styled.has(element)) {
                styled.add(element);
                if (state.fontsize > 1 && Number.isFinite(data.size)) {
                    write(element, 'font-size', `${data.size * state.fontsize}px`);
                }
                Object.entries(textStyles).forEach(([tool, styles]) => {
                    if (state[tool]) {
                        Object.entries(styles).forEach(([property, value]) => write(element, property, value));
                    }
                });
                if ((state.links && element.matches('a[href]')) || (state.headings && element.matches('h1,h2,h3,h4,h5,h6'))) {
                    Object.entries(highlightStyles).forEach(([property, value]) => write(element, property, value));
                }
                if (contrast) {
                    write(element, 'color', contrastStyles[contrast].color);
                    if (data.image !== 'none') {
                        write(element, 'background-image', 'none');
                    }
                }
            }
            // Backgrounds, not text boxes, carry the page contrast: every painted surface plus the canvas.
            if (contrast && (element === doc.body || isPainted(data.background))) {
                write(element, 'background-color', contrastStyles[contrast]['background-color']);
            }
        });
        tinted.forEach(element => {
            const colour = parseColour(info.get(element).background);
            const tint = TINT[filter] || (colourVisionFilters[filter] && (rgb => applyMatrix(rgb, readMatrix(doc, filter))));
            if (colour && colour.alpha > 0 && tint) {
                const [r, g, b] = tint(colour.rgb).map(value => Math.round(Math.min(255, Math.max(0, value))));
                write(element, 'background-color', `rgba(${r}, ${g}, ${b}, ${colour.alpha})`);
            }
        });
        targets.forEach(element => {
            const existing = info.get(element).filter;
            write(element, 'filter', `${existing && existing !== 'none' ? existing + ' ' : ''}${filters[filter]}`);
        });
    };
    const placeGuide = centre => {
        if (!guide) {
            return;
        }
        guideCentre = centre;
        const height = Math.min(60, Math.max(0, win.innerHeight));
        const top = Math.max(0, Math.min(win.innerHeight - height, centre - height / 2));
        guide.style.top = `${top}px`;
        write(doc.documentElement, '--sis-guide-top', `${top}px`);
        write(doc.documentElement, '--sis-guide-height', `${height}px`);
    };
    const move = event => placeGuide(event.clientY);
    const resizeGuide = () => placeGuide(guideCentre);
    const focusGuide = event => {
        const rect = event.target.getBoundingClientRect?.();
        if (rect) {
            placeGuide(rect.top + rect.height / 2);
        }
    };
    const reset = () => {
        observer?.disconnect();
        restore();
        guide?.remove();
        guide = null;
        doc.documentElement.classList.remove('sis-a11y-cursor', 'sis-a11y-animations', 'sis-a11y-guide-on');
        win.removeEventListener('pointermove', move);
        win.removeEventListener('resize', resizeGuide);
        doc.removeEventListener('focusin', focusGuide);
        state = {};
    };
    const apply = input => {
        reset();
        state = {...input};
        decorate(doc);
        if (state.cursor) {
            doc.documentElement.classList.add('sis-a11y-cursor');
        }
        if (state.guide) {
            guide = doc.createElement('div');
            guide.id = 'sis-a11y-guide';
            guide.setAttribute('aria-hidden', 'true');
            doc.body.append(guide);
            doc.documentElement.classList.add('sis-a11y-guide-on');
            placeGuide(win.innerHeight / 2);
            win.addEventListener('pointermove', move, {passive: true});
            win.addEventListener('resize', resizeGuide, {passive: true});
            doc.addEventListener('focusin', focusGuide);
        }
        doc.documentElement.classList.toggle('sis-a11y-animations', !!state.animations);
        if (Object.keys(state).some(key => state[key] && !(key === 'fontsize' && state[key] === 1))) {
            // Only observe child insertion; our own style writes cannot trigger an observer loop.
            observer = new win.MutationObserver(records => {
                // Restore detached nodes before releasing references, so reinsertion cannot compound effects.
                for (const [element, record] of originals) {
                    if (!element.isConnected) {
                        restoreElement(record, element);
                        originals.delete(element);
                        styled.delete(element);
                    }
                }
                // Process new subtrees only. Avoid re-multiplying parents or the full document.
                const seen = new Set();
                const inserted = new Set();
                records.forEach(record => record.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.isConnected) {
                        inserted.add(node);
                    }
                    const textOnly = node.nodeType === 3;
                    const target = textOnly ? node.parentElement : node;
                    if (target?.nodeType === 1 && target.isConnected && !target.closest(WIDGET) && !seen.has(target)) {
                        seen.add(target);
                        decorate(target, textOnly ? 'text' : 'all');
                    }
                }));
                // Fixed UI, editors or the widget inserted under a filtered block would be re-anchored to it: split that block.
                if (Object.keys(filters).some(tool => state[tool])) {
                    const split = new Set();
                    inserted.forEach(target => {
                        const wrapper = filterAncestor(target);
                        if (wrapper && !split.has(wrapper) && hazardIn(target)) {
                            split.add(wrapper);
                        }
                    });
                    split.forEach(wrapper => {
                        unwrite(wrapper, 'filter');
                        decorate(wrapper, 'filter');
                    });
                }
            });
            observer.observe(doc.body, {childList: true, subtree: true});
        }
    };
    return {apply, reset, destroy: reset};
};
