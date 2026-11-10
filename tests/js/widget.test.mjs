import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {init} from '../../amd/src/init.js';
test('footer uses the supplied local SIS logo and a safe GFARIAS link', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test/moodle'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['bold'], labels: {}, scope: 'test',
        logourl: 'https://example.test/moodle/local/sisaccessibility/pix/sis-logo.png'});
    const logo = document.querySelector('.sis-a11y-brand-logo');
    assert.equal(logo.src, 'https://example.test/moodle/local/sisaccessibility/pix/sis-logo.png');
    assert.equal(logo.alt, 'SIS Accessibility');
    assert.equal(logo.width, 300);
    assert.equal(logo.height, 181);
    const link = document.querySelector('.sis-a11y-brand-link');
    assert.equal(link.textContent, 'GFARIAS');
    assert.equal(link.href, 'https://gfarias.com/');
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    widget.destroy();
});
test('initialization is unique; buttons update state, reset clears effects', () => {
    const dom = new JSDOM('<body><main><p style="font-size:16px">Course</p></main><div id="sis-a11y-root"></div></body>',
        {url: 'https://example.test/moodle'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const config = {tools: ['bold', 'fontsize'], labels: {open: 'Open', close: 'Close', reset: 'Reset', title: 'Accessibility',
        bold: 'Bold', fontsize: 'Text size', increase: 'Increase', decrease: 'Decrease', status: 'Text size'}, persist: true,
        scope: 'local_sisaccessibility:v1:test:session', position: 'bottom-left', mobileposition: 'bottom-left'};
    const widget = init(config);
    assert.equal(init(config), widget);
    assert.equal(document.querySelectorAll('#sis-a11y-panel').length, 1);
    document.querySelector('[data-tool="bold"]').click();
    assert.equal(document.querySelector('[data-tool="bold"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('p').style.fontWeight, '700');
    document.querySelector('[data-action="increase"]').click();
    assert.equal(document.querySelector('p').style.fontSize, '17.6px');
    document.querySelector('[data-action="reset"]').click();
    assert.equal(document.querySelector('p').getAttribute('style'), 'font-size:16px');
    assert.equal(window.localStorage.length, 0);
    widget.destroy();
    assert.equal(document.querySelector('#sis-a11y-root').childElementCount, 0);
});
test('server-rendered configuration initializes without a large AMD argument', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test/moodle'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const root = document.getElementById('sis-a11y-root');
    root.dataset.config = JSON.stringify({tools: ['bold'], labels: {bold: 'Negrito', title: 'Acessibilidade',
        open: 'Abrir', close: 'Fechar', reset: 'Redefinir'}, persist: false, scope: 'test'});
    const widget = init();
    assert.ok(widget);
    assert.equal(document.querySelector('[data-tool="bold"]').textContent, 'Negrito');
    widget.destroy();
});
test('scale boundaries keep keyboard focus and ignore aria-disabled actions', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['fontsize'], labels: {}, persist: false, scope: 'test'});
    const plus = document.querySelector('[data-action="increase"]');
    const minus = document.querySelector('[data-action="decrease"]');
    plus.focus();
    for(let i=0;i<15;i++) { plus.click(); }
    assert.equal(plus.getAttribute('aria-disabled'), 'true');
    assert.equal(plus.disabled, false);
    assert.equal(document.activeElement, plus);
    minus.focus();
    for(let i=0;i<15;i++) { minus.click(); }
    assert.equal(minus.getAttribute('aria-disabled'), 'true');
    assert.equal(document.activeElement, minus);
    widget.destroy();
});

test('Sienna launcher and grouped cards replace the generic dialog', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['fontsize', 'bold', 'monochrome', 'guide', 'animations'],
        labels: {contentgroup: 'Content', colourgroup: 'Colours', visualgroup: 'Visual', toolsgroup: 'Tools'}, scope: 'test'});
    assert.equal(document.querySelector('.sis-a11y-launcher svg').getAttribute('viewBox'), '0 0 24 24');
    assert.ok(document.querySelector('.sis-a11y-launcher path[d^="M20.5 6"]'));
    assert.equal(document.querySelectorAll('.sis-a11y-card[data-group]').length, 4);
    assert.ok(document.querySelector('[data-group="content"] [data-tool="bold"] svg'));
    assert.ok(document.querySelector('[data-group="colour"] [data-tool="monochrome"]'));
    assert.ok(document.querySelector('.sis-a11y-header [data-action="reset"]'));
    widget.destroy();
});
test('local profiles switch tools and restore the manual selection when disabled', () => {
    const dom = new JSDOM('<body><main><p>Course</p></main><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['bold', 'animations', 'lowsaturation'], labels: {}, scope: 'test', persist: false});
    document.querySelector('[data-tool="bold"]').click();
    const profile = document.querySelector('[data-profile="seizure-safe"]');
    profile.click();
    assert.equal(profile.getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-tool="lowsaturation"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-tool="bold"]').getAttribute('aria-pressed'), 'false');
    profile.click();
    assert.equal(document.querySelector('[data-tool="bold"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-tool="lowsaturation"]').getAttribute('aria-pressed'), 'false');
    widget.destroy();
});

test('saved preset is identified after initialization and can be switched off', () => {
    const dom = new JSDOM('<body><p>Course</p><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const config = {tools: ['animations', 'lowsaturation'], labels: {}, scope: 'preset-reload', persist: true};
    let widget = init(config);
    document.querySelector('[data-profile="seizure-safe"]').click();
    widget.destroy();
    widget = init(config);
    assert.equal(document.querySelector('[data-profile="seizure-safe"]').getAttribute('aria-pressed'), 'true');
    document.querySelector('[data-profile="seizure-safe"]').click();
    assert.equal(document.querySelector('[data-tool="lowsaturation"]').getAttribute('aria-pressed'), 'false');
    assert.equal(document.querySelector('[data-tool="animations"]').getAttribute('aria-pressed'), 'false');
    widget.destroy();
});
test('centre positions are applied to desktop and mobile placement', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['bold'], labels: {}, persist: false, scope: 'test',
        position: 'center-right', mobileposition: 'center-left'});
    const root = document.getElementById('sis-a11y-root');
    assert.equal(root.dataset.position, 'center-right');
    assert.equal(root.dataset.mobileposition, 'center-left');
    widget.destroy();
});
test('unknown placement falls back to centre-left and sienna blue defaults', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ['bold'], labels: {}, persist: false, scope: 'test', position: 'centre', mobileposition: 'top'});
    const root = document.getElementById('sis-a11y-root');
    assert.equal(root.dataset.position, 'center-right');
    assert.equal(root.dataset.mobileposition, 'center-right');
    assert.equal(root.style.getPropertyValue('--sis-colour'), '#0848ca');
    assert.equal(root.style.getPropertyValue('--sis-textcolour'), '#ffffff');
    widget.destroy();
});

test('obsolete tools and their dependent profiles cannot appear even with stale server settings', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const removed = ['superfocus', 'pdfreader', 'pagestructure', 'screenreader'];
    const tools = ['fontsize', 'bold', 'lineheight', 'letterspacing', 'dyslexia', 'links', 'headings',
        'monochrome', 'lowsaturation', 'highsaturation', 'highcontrast', 'lightcontrast', 'darkcontrast',
        'cursor', 'guide', 'animations', 'hideimages', 'imagetooltips', ...removed];
    const widget = init({tools, labels: {}, scope: 'removed-tools', persist: false});
    removed.forEach(tool => assert.equal(document.querySelector(`[data-tool="${tool}"]`), null));
    assert.deepEqual([...document.querySelectorAll('[data-profile]')].map(el => el.dataset.profile),
        ['seizure-safe', 'visually-impaired', 'adhd-friendly', 'cognitive-learning', 'dyslexia', 'senior', 'motor', 'night']);
    widget.destroy();
});

const ALL_TOOLS = ['fontsize', 'bold', 'lineheight', 'letterspacing', 'dyslexia', 'links', 'headings',
    'monochrome', 'lowsaturation', 'highsaturation', 'highcontrast', 'lightcontrast', 'darkcontrast',
    'cursor', 'guide', 'animations', 'hideimages', 'imagetooltips',
    'protanopia', 'deuteranopia', 'tritanopia', 'pausemedia', 'silencemedia'];
const matrix = tool => `<filter id="sis-a11y-${tool}"><feColorMatrix type="matrix" ` +
    'values="1 0 0 0 0 0.16279 0.725047 0.112165 0 0 0.454695 -0.645392 1.190697 0 0 0 0 0 1 0"/></filter>';
const FILTERS = `<svg id="sis-a11y-filters"><defs>${matrix('deuteranopia')}</defs></svg>`;
const ALL_FILTERS = `<svg id="sis-a11y-filters"><defs>${['protanopia', 'deuteranopia', 'tritanopia'].map(matrix).join('')}</defs></svg>`;
const withDialog = window => {
    // jsdom does not implement the modal dialog API; model only what the widget relies on.
    const proto = window.HTMLDialogElement.prototype;
    proto.showModal = function() {
        this.setAttribute('open', '');
    };
    proto.close = function() {
        this.removeAttribute('open');
        this.dispatchEvent(new window.Event('close'));
    };
};
const press = (target, init) => {
    const event = new window.KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...init});
    target.dispatchEvent(event);
    return event;
};
test('every profile is available with all tools and names only enabled, mutually compatible tools', () => {
    const dom = new JSDOM('<body>' + ALL_FILTERS + '<div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ALL_TOOLS, labels: {}, scope: 'all-profiles', persist: false});
    const ids = [...document.querySelectorAll('[data-profile]')].map(el => el.dataset.profile);
    assert.deepEqual(ids, ['seizure-safe', 'visually-impaired', 'adhd-friendly', 'cognitive-learning', 'dyslexia',
        'colour-blind', 'senior', 'motor', 'night']);
    ids.forEach(id => assert.ok(document.querySelector(`[data-profile="${id}"] svg path, [data-profile="${id}"] svg circle`), id));
    document.querySelector('[data-profile="colour-blind"]').click();
    assert.equal(document.querySelector('[data-tool="deuteranopia"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-tool="links"]').getAttribute('aria-pressed'), 'true');
    document.querySelector('[data-profile="night"]').click();
    assert.equal(document.querySelector('[data-tool="darkcontrast"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-tool="deuteranopia"]').getAttribute('aria-pressed'), 'false');
    document.querySelector('[data-tool="protanopia"]').click();
    assert.equal(document.querySelector('[data-tool="darkcontrast"]').getAttribute('aria-pressed'), 'false',
        'colour-vision filters are mutually exclusive with the other colour modes');
    widget.destroy();
});
test('profiles that need a disabled tool are not offered', () => {
    const dom = new JSDOM('<body>' + ALL_FILTERS + '<div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ALL_TOOLS.filter(tool => tool !== 'deuteranopia'), labels: {}, scope: 'x', persist: false});
    assert.equal(document.querySelector('[data-profile="colour-blind"]'), null);
    assert.ok(document.querySelector('[data-profile="night"]'));
    widget.destroy();
});
test('Alt+A opens and closes the panel; other modifiers and repeats are ignored', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    withDialog(dom.window);
    const widget = init({tools: ['bold'], labels: {shortcut_hint: 'Atalho: Alt+A'}, scope: 'shortcut', persist: false});
    const panel = document.getElementById('sis-a11y-panel');
    const launcher = document.querySelector('.sis-a11y-launcher');
    assert.equal(launcher.getAttribute('aria-keyshortcuts'), 'Alt+A');
    assert.equal(launcher.title, 'Atalho: Alt+A');
    assert.equal(press(document.body, {key: 'a', code: 'KeyA', altKey: true, ctrlKey: true}).defaultPrevented, false);
    press(document.body, {key: 'a', code: 'KeyA', altKey: true, metaKey: true});
    press(document.body, {key: 'a', code: 'KeyA', altKey: true, shiftKey: true});
    press(document.body, {key: 'a', code: 'KeyA'});
    assert.equal(panel.open, false);
    const opened = press(document.body, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(opened.defaultPrevented, true);
    assert.equal(panel.open, true);
    assert.equal(launcher.getAttribute('aria-expanded'), 'true');
    press(document.body, {key: 'a', code: 'KeyA', altKey: true, repeat: true});
    assert.equal(panel.open, true, 'a held key does not flicker the panel');
    press(document.body, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(panel.open, false);
    assert.equal(document.activeElement, launcher, 'focus returns to the launcher');
    // macOS Option+A reports another character; the physical key still counts.
    press(document.body, {key: '\u00e5', code: 'KeyA', altKey: true});
    assert.equal(panel.open, true);
    widget.destroy();
    press(document.body, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(panel.open, false, 'destroy removes the listener');
});
test('Alt+A leaves typing, other letters and open Moodle modals alone, and returns focus to where the user was', () => {
    const dom = new JSDOM('<body><input id="field"><button id="before">Before</button><div id="sis-a11y-root"></div></body>',
        {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    withDialog(dom.window);
    const widget = init({tools: ['bold'], labels: {}, scope: 'shortcut2', persist: false});
    const panel = document.getElementById('sis-a11y-panel');
    const field = document.getElementById('field');
    const typing = press(field, {key: '\u00e5', code: 'KeyA', altKey: true});
    assert.equal(typing.defaultPrevented, false, 'Option+A types a character in a field');
    assert.equal(panel.open, false);
    // AZERTY: the physical A key produces "q"; only the letter A counts.
    assert.equal(press(document.body, {key: 'q', code: 'KeyA', altKey: true}).defaultPrevented, false);
    assert.equal(panel.open, false);
    // An open Moodle modal keeps the keystroke.
    document.body.insertAdjacentHTML('beforeend', '<div class="modal show" style="display:block"></div>');
    assert.equal(press(document.body, {key: 'a', code: 'KeyA', altKey: true}).defaultPrevented, false);
    assert.equal(panel.open, false);
    document.querySelector('.modal').remove();
    const before = document.getElementById('before');
    before.focus();
    press(before, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(panel.open, true);
    press(document.body, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(panel.open, false);
    assert.equal(document.activeElement, before, 'focus goes back to where the user was, not to the launcher');
    widget.destroy();
});
test('the shortcut can be disabled by the administrator', () => {
    const dom = new JSDOM('<body><div id="sis-a11y-root"></div></body>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    withDialog(dom.window);
    const widget = init({tools: ['bold'], labels: {}, scope: 'noshortcut', persist: false, shortcut: false});
    const launcher = document.querySelector('.sis-a11y-launcher');
    assert.equal(launcher.hasAttribute('aria-keyshortcuts'), false);
    assert.equal(launcher.hasAttribute('title'), false);
    press(document.body, {key: 'a', code: 'KeyA', altKey: true});
    assert.equal(document.getElementById('sis-a11y-panel').open, false);
    widget.destroy();
});
test('the first-paint classes set by the early snippet are removed once the widget applies the exact state', () => {
    const dom = new JSDOM('<html class="keep sis-a11y-pre sis-a11y-pre-bold sis-a11y-pre-fontsize" ' +
        'style="--sis-pre-fontsize: 1.4"><body><p>Course</p><div id="sis-a11y-root"></div></body></html>',
    {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const key = 'local_sisaccessibility:v1:pre:session';
    dom.window.localStorage.setItem(key, JSON.stringify({version: 1, expires: Date.now() + 1000000,
        state: {bold: true, fontsize: 1.4}}));
    const widget = init({tools: ['bold', 'fontsize'], labels: {}, scope: key, persist: true});
    const html = document.documentElement;
    assert.equal(html.className, 'keep');
    assert.equal(html.hasAttribute('style'), false);
    assert.equal(document.querySelector('p').style.fontWeight, '700', 'the saved state is applied exactly');
    widget.destroy();
});
test('a colour-vision tool is offered only when the page defines its filter', () => {
    const dom = new JSDOM('<body><main style="background:#fff"><p>Texto</p></main><div id="sis-a11y-root"></div></body>',
        {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    const widget = init({tools: ALL_TOOLS, labels: {}, scope: 'cvd', persist: false});
    assert.equal(document.querySelector('[data-tool="deuteranopia"]'), null, 'no SVG on the page, so no dead switch');
    assert.equal(document.querySelector('[data-tool="protanopia"]'), null);
    assert.equal(document.querySelector('[data-profile="colour-blind"]'), null);
    assert.ok(document.querySelector('[data-tool="monochrome"]'));
    widget.destroy();
    document.body.insertAdjacentHTML('afterbegin', FILTERS);
    const again = init({tools: ALL_TOOLS, labels: {}, scope: 'cvd2', persist: false});
    assert.equal(document.querySelector('[data-tool="protanopia"]'), null, 'only the filters that are defined');
    document.querySelector('[data-tool="deuteranopia"]').click();
    assert.equal(document.querySelector('main').style.filter, 'url(#sis-a11y-deuteranopia)');
    assert.ok(document.querySelector('[data-profile="colour-blind"]'));
    again.destroy();
});
test('the first-paint classes are dropped before anything is measured and even when the widget cannot start', () => {
    const dom = new JSDOM('<html class="sis-a11y-pre sis-a11y-pre-darkcontrast" style="--sis-pre-fontsize: 1.4">' +
        '<body><p>x</p></body></html>', {url: 'https://example.test'});
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    assert.equal(init({tools: ['bold'], labels: {}, scope: 'none'}), null, 'no widget root on the page');
    assert.equal(document.documentElement.className, '');
    assert.equal(document.documentElement.hasAttribute('style'), false);
    // The approximation must be gone while the exact state is measured, or sizes and backgrounds would compound.
    const seen = [];
    const html = document.documentElement;
    html.className = 'sis-a11y-pre sis-a11y-pre-fontsize';
    document.body.insertAdjacentHTML('beforeend', '<div id="sis-a11y-root"></div>');
    const key = 'local_sisaccessibility:v1:measure:session';
    dom.window.localStorage.setItem(key, JSON.stringify({version: 1, expires: Date.now() + 1e6, state: {bold: true}}));
    const original = dom.window.getComputedStyle.bind(dom.window);
    dom.window.getComputedStyle = element => {
        seen.push(html.className);
        return original(element);
    };
    const widget = init({tools: ['bold'], labels: {}, scope: key, persist: true});
    assert.ok(seen.length > 0);
    assert.ok(seen.every(name => name === ''), 'classes were still set while measuring: ' + [...new Set(seen)]);
    widget.destroy();
});
