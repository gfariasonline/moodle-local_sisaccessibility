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
    assert.equal(root.dataset.position, 'center-left');
    assert.equal(root.dataset.mobileposition, 'center-left');
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
        ['seizure-safe', 'visually-impaired', 'adhd-friendly', 'cognitive-learning']);
    widget.destroy();
});
