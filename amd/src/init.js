// This file is part of Moodle - http://moodle.org/
// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/init */
import {createPreferences, normalise, colourTools} from 'local_sisaccessibility/preferences';
import {createEffects} from 'local_sisaccessibility/effects';
import {createAids} from 'local_sisaccessibility/aids';
import {createIcon} from 'local_sisaccessibility/icons';
import {profiles} from 'local_sisaccessibility/profiles';
import {colourVisionTools, readMatrix} from 'local_sisaccessibility/colourvision';

const ICONS = {fontsize: 'font-size', bold: 'font-weight', lineheight: 'line-height', letterspacing: 'letter-spacing',
    dyslexia: 'readable-font', links: 'highlight-links', headings: 'highlight-title', monochrome: 'monochrome',
    lowsaturation: 'low-saturation', highsaturation: 'high-saturation', highcontrast: 'high-contrast',
    lightcontrast: 'light-contrast', darkcontrast: 'dark-contrast', cursor: 'big-cursor', guide: 'readable-guide',
    animations: 'stop-animations', hideimages: 'hide-images', imagetooltips: 'image-tooltips',
    protanopia: 'colour-vision', deuteranopia: 'colour-vision', tritanopia: 'colour-vision',
    pausemedia: 'pause-media', silencemedia: 'silence-media'};
const GROUPS = [
    {id: 'content', label: 'contentgroup', tools: ['fontsize', 'bold', 'lineheight', 'letterspacing',
        'dyslexia', 'links', 'headings']},
    {id: 'visual', label: 'visualgroup', tools: ['guide', 'cursor']},
    {id: 'colour', label: 'colourgroup', tools: colourTools},
    {id: 'tools', label: 'toolsgroup', tools: ['animations', 'pausemedia', 'silencemedia', 'hideimages', 'imagetooltips']},
];

const availableLanguages = config => config.languages || {
    [config.language || 'en']: config.labels['language_' + (config.language || 'en')] || config.language || 'English'
};

/**
 * Drop the first-paint approximation set by the early snippet. It must happen before the exact adjustments are measured
 * and applied (the approximation changes computed sizes and backgrounds), and whatever else happens afterwards.
 * @param {Document} doc
 */
const clearFirstPaint = doc => {
    const html = doc.documentElement;
    [...html.classList].filter(name => name.startsWith('sis-a11y-pre')).forEach(name => html.classList.remove(name));
    html.style.removeProperty('--sis-pre-fontsize');
    if (html.hasAttribute('style') && !html.getAttribute('style')) {
        html.removeAttribute('style');
    }
};

/**
 * Explicit, idempotent entry point scheduled by Moodle's output hook.
 * @param {Object} config
 */
export const init = config => {
    const doc = document;
    clearFirstPaint(doc);
    const root = doc.getElementById('sis-a11y-root');
    if (!root) {
        return null;
    }
    if (root.sisAccessibility) {
        return root.sisAccessibility;
    }
    if (!config) {
        try {
            config = JSON.parse(root.dataset.config || '{}');
        } catch (error) {
            return null;
        }
    }
    if (!Array.isArray(config?.tools) || !config.tools.length || !config.labels) {
        return null;
    }
    // A colour-vision filter works only if the page defines it; a switch that does nothing would only mislead.
    const enabled = config.tools.filter(tool => !colourVisionTools.includes(tool) || readMatrix(doc, tool));
    if (!enabled.length) {
        return null;
    }
    // A footer hook may render inside a theme container; keep the widget outside page effects.
    doc.body.append(root);
    const labels = config.labels;
    const label = key => labels[key] || key;
    const make = (tag, text = '', className = '') => {
        const element = doc.createElement(tag);
        element.textContent = text;
        element.className = className;
        return element;
    };
    const button = (text = '', className = '') => {
        const element = make('button', text, className);
        element.type = 'button';
        return element;
    };
    const icon = key => createIcon(doc, key);
    const integer = (value, fallback, low, high) => Math.max(low, Math.min(high, Number.isFinite(+value) ? +value : fallback));
    const positions = ['center-left', 'center-right', 'bottom-left', 'bottom-right', 'top-left', 'top-right'];
    const position = value => positions.includes(value) ? value : 'center-right';
    root.dataset.position = position(config.position);
    root.dataset.mobileposition = position(config.mobileposition);
    ['size', 'mobilesize'].forEach(key => root.style.setProperty(`--sis-${key}`, `${integer(config[key], 56, 48, 96)}px`));
    ['offsetx', 'offsety', 'mobileoffsetx', 'mobileoffsety'].forEach(key =>
        root.style.setProperty(`--sis-${key}`, `${integer(config[key], 20, 0, 200)}px`));
    root.style.setProperty('--sis-colour', /^#[0-9a-f]{6}$/i.test(config.colour) ? config.colour : '#0848ca');
    root.style.setProperty('--sis-textcolour', /^#[0-9a-f]{6}$/i.test(config.textcolour) ? config.textcolour : '#ffffff');
    const launcher = button('', 'sis-a11y-launcher');
    launcher.setAttribute('aria-label', label('open'));
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'sis-a11y-panel');
    const shortcut = config.shortcut !== false;
    if (shortcut) {
        launcher.setAttribute('aria-keyshortcuts', 'Alt+A');
        launcher.title = label('shortcut_hint');
    }
    launcher.append(icon('launcher'));
    const panel = make('dialog', '', 'sis-a11y-panel');
    panel.id = 'sis-a11y-panel';
    panel.setAttribute('aria-labelledby', 'sis-a11y-title');
    panel.setAttribute('aria-modal', 'true');
    const header = make('header', '', 'sis-a11y-header');
    const heading = make('h2', label('title'));
    heading.id = 'sis-a11y-title';
    const headerActions = make('div', '', 'sis-a11y-header-actions');
    const resetTop = button('', 'sis-a11y-reset-top');
    resetTop.dataset.action = 'reset';
    resetTop.setAttribute('aria-label', label('reset'));
    resetTop.title = label('reset');
    resetTop.append(icon('reset'));
    const close = button('', 'sis-a11y-close');
    close.setAttribute('aria-label', label('close'));
    close.append(icon('close'));
    headerActions.append(resetTop, close);
    header.append(heading, headerActions);
    const content = make('div', '', 'sis-a11y-content');
    const tools = make('div', '', 'sis-a11y-tools');
    const status = make('output', '', 'sis-a11y-status');
    status.setAttribute('aria-live', 'polite');
    const localeCard = make('div', '', 'sis-a11y-card sis-a11y-language');
    const locale = make('select');
    locale.setAttribute('aria-label', label('language'));
    const languages = availableLanguages(config);
    Object.entries(languages).forEach(([code, name]) => {
        const option = make('option', name);
        option.value = code;
        locale.append(option);
    });
    locale.value = config.language || 'en';
    locale.addEventListener('change', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', locale.value);
        window.location.assign(url.href);
    });
    localeCard.append(locale);
    const makeCard = (title, id) => {
        const card = make('section', '', 'sis-a11y-card');
        card.dataset.group = id;
        const h = make('h3', title, 'sis-a11y-card-title');
        card.append(h);
        return card;
    };
    const availableProfiles = profiles.filter(profile => Object.keys(profile.state).every(tool => enabled.includes(tool)));
    const profileButtons = new Map();
    if (availableProfiles.length) {
        const card = makeCard(label('profilesgroup'), 'profiles');
        const grid = make('div', '', 'sis-a11y-profiles');
        availableProfiles.forEach(profile => {
            const control = button('', 'sis-a11y-profile');
            control.dataset.profile = profile.id;
            control.setAttribute('aria-pressed', 'false');
            const symbol = make('span', '', 'sis-a11y-profile-icon');
            symbol.append(icon(profile.id));
            const title = make('strong', label(profile.label));
            const description = make('span', label(profile.label + '_desc'), 'sis-a11y-profile-description');
            const toggle = make('span', '', 'sis-a11y-toggle');
            toggle.setAttribute('aria-hidden', 'true');
            control.append(symbol, title, description, toggle);
            grid.append(control);
            profileButtons.set(profile.id, control);
        });
        card.append(grid);
        tools.append(card);
    }
    const controls = new Map();
    GROUPS.forEach(group => {
        const selected = group.tools.filter(tool => enabled.includes(tool));
        if (!selected.length) {
            return;
        }
        const card = makeCard(label(group.label), group.id);
        const grid = make('div', '', 'sis-a11y-items');
        selected.forEach(tool => {
            if (tool === 'fontsize') {
                const row = make('div', '', 'sis-a11y-scale');
                const text = make('span', label('fontsize'));
                const decrease = button('−');
                const increase = button('+');
                const amount = make('output', '100%', 'sis-a11y-amount');
                decrease.setAttribute('aria-label', label('decrease'));
                increase.setAttribute('aria-label', label('increase'));
                decrease.dataset.action = 'decrease';
                increase.dataset.action = 'increase';
                row.append(icon('font-size'), text, decrease, amount, increase);
                card.append(row);
                controls.set(tool, [decrease, increase, amount]);
            } else {
                const control = button('', 'sis-a11y-tool');
                control.dataset.tool = tool;
                control.setAttribute('aria-pressed', 'false');
                control.append(icon(ICONS[tool]), make('span', label(tool)));
                grid.append(control);
                controls.set(tool, control);
            }
        });
        card.append(grid);
        tools.append(card);
    });
    const resetCard = make('div', '', 'sis-a11y-card');
    const reset = button(label('reset'), 'sis-a11y-reset');
    reset.dataset.action = 'reset';
    resetCard.append(reset);
    content.append(tools, status, resetCard, localeCard);
    const brand = make('footer', '', 'sis-a11y-brand');
    const logo = config.logourl ? make('img', '', 'sis-a11y-brand-logo') : make('span', 'SIS Accessibility');
    if (config.logourl) {
        logo.src = config.logourl;
        logo.alt = 'SIS Accessibility';
        logo.width = 300;
        logo.height = 181;
    }
    const brandLink = make('a', 'GFARIAS', 'sis-a11y-brand-link');
    brandLink.href = 'https://gfarias.com';
    brandLink.target = '_blank';
    brandLink.rel = 'noopener noreferrer';
    brand.append(logo, brandLink);
    panel.append(header, content, brand);
    root.append(launcher, panel);
    let storage;
    try {
        storage = window.localStorage;
    } catch (error) { /* Denied storage uses memory. */ }
    const prefs = createPreferences(config.scope, enabled, config.persist, storage);
    const effects = createEffects(doc);
    const aids = createAids(doc, {root});
    let state = prefs.load();
    const canonicalState = input => JSON.stringify(Object.entries(normalise(input, enabled))
        .filter(([, value]) => value && value !== 1).sort(([a], [b]) => a.localeCompare(b)));
    let activeProfile = availableProfiles.find(profile => canonicalState(profile.state) === canonicalState(state))?.id || null;
    let beforeProfile = {};
    const render = () => {
        state = normalise(state, enabled);
        effects.apply(state);
        controls.forEach((control, tool) => {
            if (tool === 'fontsize') {
                control[0].setAttribute('aria-disabled', String((state.fontsize || 1) <= 1));
                control[1].setAttribute('aria-disabled', String((state.fontsize || 1) >= 2));
                control[2].textContent = `${Math.round((state.fontsize || 1) * 100)}%`;
            } else {
                control.setAttribute('aria-pressed', state[tool] ? 'true' : 'false');
            }
        });
        profileButtons.forEach((control, id) => control.setAttribute('aria-pressed', String(id === activeProfile)));
        const sizeStatus = enabled.includes('fontsize')
            ? `${label('status')}: ${Math.round((state.fontsize || 1) * 100)}%` : '';
        if (status.textContent !== sizeStatus) {
            status.textContent = sizeStatus;
        }
        aids.apply(state);
    };
    const activeModal = () => [...doc.querySelectorAll(
        '.modal.show,.modal.in,[role="dialog"][aria-modal="true"],dialog[open]')].find(element => {
        if (element === panel || element.hidden || element.getAttribute('aria-hidden') === 'true') {
            return false;
        }
        if (element.tagName === 'DIALOG') {
            try {
                return element.matches(':modal');
            } catch (error) {
                return element.getAttribute('aria-modal') === 'true';
            }
        }
        return window.getComputedStyle(element).display !== 'none';
    });
    let returnFocus = null;
    const closePanel = (restoreFocus = true) => {
        if (!panel.open) {
            return;
        }
        modalObserver.disconnect();
        panel.close();
        launcher.setAttribute('aria-expanded', 'false');
        if (restoreFocus) {
            (returnFocus?.isConnected ? returnFocus : launcher).focus();
        }
        returnFocus = null;
    };
    const openPanel = () => {
        if (panel.open || activeModal()) {
            return false;
        }
        const active = doc.activeElement;
        returnFocus = active && active !== doc.body && active !== doc.documentElement ? active : null;
        panel.showModal();
        launcher.setAttribute('aria-expanded', 'true');
        close.focus();
        modalObserver.observe(doc.body, {attributes: true,
            attributeFilter: ['class', 'aria-hidden', 'aria-modal', 'open'], subtree: true});
        return true;
    };
    launcher.addEventListener('click', openPanel);
    // Alt+A toggles the panel. Ctrl, Meta and Shift are left alone so AltGr layouts and browser or screen reader
    // commands keep working, and so is typing in a field (Option+A types a character on macOS). The letter is matched
    // by event.key when it is an ASCII letter (AZERTY has A elsewhere) and by the physical key otherwise (macOS
    // Option+A reports another character).
    const onShortcut = event => {
        const isA = /^[a-z]$/i.test(event.key) ? event.key.toLowerCase() === 'a' : event.code === 'KeyA';
        if (event.defaultPrevented || event.repeat || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
                !isA || event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) {
            return;
        }
        if (panel.open) {
            event.preventDefault();
            closePanel();
        } else if (openPanel()) {
            event.preventDefault();
        }
    };
    if (shortcut) {
        doc.addEventListener('keydown', onShortcut);
    }
    panel.addEventListener('cancel', event => {
        event.preventDefault(); closePanel();
    });
    panel.addEventListener('close', () => {
        modalObserver.disconnect(); launcher.setAttribute('aria-expanded', 'false');
    });
    close.addEventListener('click', () => closePanel());
    const modalObserver = new window.MutationObserver(() => {
        const other = activeModal();
        if (panel.open && other) {
            closePanel(false);
            if (!other.contains(doc.activeElement)) {
                const target = other.hasAttribute('tabindex') ? other : other.querySelector('button,input,[tabindex]');
                target?.focus();
            }
        }
    });
    tools.addEventListener('click', event => {
        const target = event.target.closest('button');
        if (!target || target.getAttribute('aria-disabled') === 'true') {
            return;
        }
        if (target.dataset.profile) {
            const profile = availableProfiles.find(item => item.id === target.dataset.profile);
            if (activeProfile === profile.id) {
                state = {...beforeProfile};
                activeProfile = null;
            } else {
                if (!activeProfile) {
                    beforeProfile = {...state};
                }
                state = {...profile.state};
                activeProfile = profile.id;
            }
        } else if (target.dataset.tool) {
            const tool = target.dataset.tool;
            const active = !state[tool];
            if (colourTools.includes(tool)) {
                colourTools.forEach(key => delete state[key]);
            }
            state[tool] = active;
            activeProfile = null;
        } else if (target.dataset.action === 'increase' || target.dataset.action === 'decrease') {
            state.fontsize = (state.fontsize || 1) + (target.dataset.action === 'increase' ? 0.1 : -0.1);
            activeProfile = null;
        } else {
            return;
        }
        state = prefs.save(state);
        render();
    });
    const resetAll = () => {
        prefs.reset();
        state = {};
        activeProfile = null;
        beforeProfile = {};
        render();
    };
    reset.addEventListener('click', resetAll);
    resetTop.addEventListener('click', resetAll);
    render();
    const widget = {destroy: () => {
        doc.removeEventListener('keydown', onShortcut);
        closePanel();
        effects.destroy();
        aids.destroy();
        modalObserver.disconnect();
        root.replaceChildren();
        delete root.sisAccessibility;
    }};
    root.sisAccessibility = widget;
    return widget;
};
