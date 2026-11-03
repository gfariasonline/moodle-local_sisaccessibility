// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/aids */
import {iconSelector} from 'local_sisaccessibility/sienna';

const IMAGE_ATTR = 'data-sis-a11y-image';
const EXCLUDE = '#sis-a11y-root,.sis-a11y-image-tip,svg,.tox,.mce-container,.editor_atto,' +
    '.CodeMirror,.ace_editor,[contenteditable]:not([contenteditable="false"]),' + iconSelector;
/**
 * Image visibility and image descriptions, using only the current page's content.
 *
 * @param {Document} doc
 * @param {{root?: Element, panel?: Element}} options
 */
export const createAids = (doc = document, options = {}) => {
    const win = doc.defaultView;
    const root = options.root || doc.getElementById('sis-a11y-root') || doc.body;
    const make = (tag, className, text) => {
        const element = doc.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (text) {
            element.textContent = text;
        }
        return element;
    };
    const own = element => !!element?.closest?.(EXCLUDE) || (root !== doc.body && root.contains(element)) ||
        !!options.panel?.contains(element);
    const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
    const observeAdded = callback => {
        const observer = new win.MutationObserver(records => records.flatMap(record => [...record.addedNodes])
            .map(node => node.nodeType === 3 ? node.parentElement : node)
            .filter(node => node?.nodeType === 1 && !own(node)).forEach(callback));
        observer.observe(doc.body, {childList: true, subtree: true});
        return observer;
    };

    // Hide images: a marker attribute plus stylesheet rules, so layout, inline styles and icons stay untouched.
    const hideimages = (() => {
        let observer = null;
        const mark = scope => {
            const elements = [...scope.querySelectorAll('img,input[type="image"]')];
            if (scope.matches?.('img,input[type="image"]')) {
                elements.unshift(scope);
            }
            elements.filter(element => !own(element)).forEach(element => element.setAttribute(IMAGE_ATTR, 'img'));
            [scope, ...scope.querySelectorAll('*')].filter(element => !element.hasAttribute(IMAGE_ATTR) && !own(element) &&
                /url\(/.test(win.getComputedStyle(element).backgroundImage))
                .forEach(element => element.setAttribute(IMAGE_ATTR, 'bg'));
        };
        return {
            on: () => {
                if (observer) {
                    return;
                }
                doc.documentElement.classList.add('sis-a11y-hideimages');
                mark(doc.body);
                observer = observeAdded(mark);
            },
            off: () => {
                observer?.disconnect();
                observer = null;
                doc.documentElement.classList.remove('sis-a11y-hideimages');
                doc.querySelectorAll('[' + IMAGE_ATTR + ']').forEach(element => element.removeAttribute(IMAGE_ATTR));
            }
        };
    })();

    // Image tooltips: a pointer-events-none overlay showing the alt text on hover and keyboard focus.
    const imagetooltips = (() => {
        let active = false;
        let tip = null;
        const hide = () => {
            tip?.remove();
            tip = null;
        };
        const show = image => {
            const alt = clean(image?.getAttribute('alt'));
            hide();
            if (!alt || own(image)) {
                return;
            }
            const rect = image.getBoundingClientRect();
            tip = make('div', 'sis-a11y-image-tip', alt);
            tip.setAttribute('role', 'tooltip');
            tip.style.pointerEvents = 'none';
            tip.style.position = 'fixed';
            tip.style.left = `${Math.max(0, rect.left)}px`;
            tip.style.top = `${Math.max(0, rect.bottom + 4)}px`;
            doc.body.append(tip);
        };
        const handlers = {
            pointerover: event => show(event.target.closest?.('img')),
            pointerout: hide,
            focusin: event => {
                if (event.target.matches?.('img')) {
                    show(event.target);
                } else if (event.target.matches?.('a,button,[role="button"],[role="link"]')) {
                    show(event.target.querySelector('img[alt]:not([alt=""])'));
                } else {
                    show(null);
                }
            },
            focusout: hide,
            keydown: event => event.key === 'Escape' && hide()
        };
        const listen = on => Object.entries(handlers).forEach(([type, handler]) =>
            doc[on ? 'addEventListener' : 'removeEventListener'](type, handler));
        return {
            on: () => {
                if (!active) {
                    active = true;
                    listen(true);
                }
            },
            off: () => {
                active = false;
                listen(false);
                hide();
            }
        };
    })();

    const tools = {hideimages, imagetooltips};
    const reset = () => Object.values(tools).forEach(tool => tool.off());
    const apply = state => {
        Object.entries(tools).forEach(([key, tool]) => tool[state?.[key] ? 'on' : 'off']());
    };
    return {apply, reset, destroy: reset};
};
