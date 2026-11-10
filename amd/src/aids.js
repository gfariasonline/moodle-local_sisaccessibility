// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/aids */
import {iconSelector} from 'local_sisaccessibility/sienna';

const IMAGE_ATTR = 'data-sis-a11y-image';
const EXCLUDE = '#sis-a11y-root,.sis-a11y-image-tip,svg,.tox,.mce-container,.editor_atto,' +
    '.CodeMirror,.ace_editor,[contenteditable]:not([contenteditable="false"]),' + iconSelector;
const MEDIA = 'video,audio';
const GIF = /\.gif(?:[?#]|$)/i;
// A play() within this window of a pointer or key press is the user's own choice and is never blocked.
const GESTURE_WINDOW = 1000;
/**
 * Image visibility, image descriptions and media control, using only the current page's content.
 *
 * @param {Document} doc
 * @param {{root?: Element, panel?: Element, snapshot?: function(HTMLImageElement): ?string}} options The optional
 *     snapshot callback returns a still-image URL for a loaded image, or null when it cannot be read.
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

    const mediaIn = scope => {
        const found = [...scope.querySelectorAll(MEDIA)];
        if (scope.matches?.(MEDIA)) {
            found.unshift(scope);
        }
        return found.filter(element => !own(element));
    };
    const listenCapture = (handlers, on) => Object.entries(handlers).forEach(([type, handler]) =>
        doc[on ? 'addEventListener' : 'removeEventListener'](type, handler, true));

    // Pause media: stop what is playing, block playback nobody asked for and freeze animated GIFs on their first frame.
    const pausemedia = (() => {
        let active = false;
        let observer = null;
        let lastGesture = -Infinity;
        const changed = new Map();
        const frozen = new Map();
        const userStarted = () => {
            // The browser's activation lasts several seconds; require our own, much shorter, window as well.
            const activation = win.navigator?.userActivation;
            return Date.now() - lastGesture < GESTURE_WINDOW && (!activation || activation.isActive);
        };
        const remember = element => {
            if (!changed.has(element)) {
                changed.set(element, element.getAttribute('autoplay'));
            }
        };
        const stop = element => {
            if (element.hasAttribute('autoplay')) {
                remember(element);
                element.removeAttribute('autoplay');
            }
            if (!element.paused) {
                element.pause();
            }
        };
        const freeze = image => {
            if (frozen.has(image) || own(image) || !GIF.test(image.currentSrc || image.src || '')) {
                return;
            }
            if (!image.complete || !image.naturalWidth) {
                image.addEventListener('load', () => active && freeze(image), {once: true});
                return;
            }
            let still = null;
            try {
                still = options.snapshot ? options.snapshot(image) : (() => {
                    const canvas = doc.createElement('canvas');
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    canvas.getContext('2d').drawImage(image, 0, 0);
                    return canvas.toDataURL('image/png');
                })();
            } catch (error) { /* A cross-origin image cannot be read back; leave it as is. */ }
            if (!still) {
                return;
            }
            frozen.set(image, {src: image.getAttribute('src'), srcset: image.getAttribute('srcset'), still});
            image.removeAttribute('srcset');
            image.src = still;
        };
        const scan = scope => {
            // Do not keep detached images, and their stills, alive for the rest of the page's life.
            frozen.forEach((value, image) => !image.isConnected && frozen.delete(image));
            changed.forEach((value, element) => !element.isConnected && changed.delete(element));
            mediaIn(scope).forEach(stop);
            [...scope.querySelectorAll('img'), ...(scope.matches?.('img') ? [scope] : [])].forEach(freeze);
        };
        const handlers = {
            play: event => {
                if (event.target.matches?.(MEDIA) && !own(event.target) && !userStarted()) {
                    stop(event.target);
                }
            },
            pointerdown: () => {
                lastGesture = Date.now();
            },
            keydown: () => {
                lastGesture = Date.now();
            }
        };
        return {
            on: () => {
                if (active) {
                    return;
                }
                active = true;
                listenCapture(handlers, true);
                scan(doc.body);
                observer = observeAdded(scan);
            },
            off: () => {
                if (!active) {
                    return;
                }
                active = false;
                observer?.disconnect();
                observer = null;
                listenCapture(handlers, false);
                changed.forEach((value, element) => element.setAttribute('autoplay', value));
                changed.clear();
                frozen.forEach(({src, srcset, still}, image) => {
                    // A page that swapped the image itself while the tool was on keeps its own choice.
                    if (image.getAttribute('src') !== still) {
                        return;
                    }
                    image.setAttribute('src', src ?? '');
                    if (srcset !== null) {
                        image.setAttribute('srcset', srcset);
                    }
                });
                frozen.clear();
            }
        };
    })();

    // Mute media: every audio and video element is silenced, including players added later or unmuted by the page.
    const silencemedia = (() => {
        let active = false;
        let observer = null;
        const before = new Map();
        const mute = element => {
            if (!before.has(element)) {
                before.set(element, element.muted);
            }
            if (!element.muted) {
                element.muted = true;
            }
        };
        const handlers = {
            volumechange: event => event.target.matches?.(MEDIA) && !own(event.target) && mute(event.target),
            play: event => event.target.matches?.(MEDIA) && !own(event.target) && mute(event.target)
        };
        return {
            on: () => {
                if (active) {
                    return;
                }
                active = true;
                listenCapture(handlers, true);
                mediaIn(doc.body).forEach(mute);
                observer = observeAdded(scope => mediaIn(scope).forEach(mute));
            },
            off: () => {
                if (!active) {
                    return;
                }
                active = false;
                observer?.disconnect();
                observer = null;
                listenCapture(handlers, false);
                before.forEach((muted, element) => {
                    element.muted = muted;
                });
                before.clear();
            }
        };
    })();

    const tools = {hideimages, imagetooltips, pausemedia, silencemedia};
    const reset = () => Object.values(tools).forEach(tool => tool.off());
    const apply = state => {
        Object.entries(tools).forEach(([key, tool]) => tool[state?.[key] ? 'on' : 'off']());
    };
    return {apply, reset, destroy: reset};
};
