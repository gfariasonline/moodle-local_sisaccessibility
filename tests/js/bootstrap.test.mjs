import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

// The snippet that reaches the first paint lives in the Mustache template; run exactly that text.
const template = readFileSync(new URL('../../templates/bootstrap.mustache', import.meta.url), 'utf8');
const script = template.match(/<script>([\s\S]*?)<\/script>/)[1];
const KEY = 'local_sisaccessibility:v1:abcdef0123456789:0123456789abcdef0123456789abcdef';
const TOOLS = ['fontsize', 'bold', 'monochrome', 'darkcontrast', 'deuteranopia', 'cursor', 'animations'];
const COLOURS = ['monochrome', 'darkcontrast', 'deuteranopia'];
const run = (stored, {tools = TOOLS, colours = COLOURS, key = KEY, storage} = {}) => {
    const dom = new JSDOM('<!doctype html><html class="existing"><body></body></html>',
        {url: 'https://example.test/moodle', runScripts: 'outside-only'});
    if (stored !== undefined) {
        dom.window.localStorage.setItem(KEY, typeof stored === 'string' ? stored : JSON.stringify(stored));
    }
    if (storage) {
        Object.defineProperty(dom.window, 'localStorage', {get: storage});
    }
    const code = script.replace('{{{key}}}', JSON.stringify(key)).replace('{{{tools}}}', JSON.stringify(tools))
        .replace('{{{colours}}}', JSON.stringify(colours));
    dom.window.eval(code);
    return dom.window.document.documentElement;
};
const fresh = state => ({version: 1, expires: Date.now() + 86400000, state});

test('saved boolean tools become first-paint classes and the text scale a custom property', () => {
    const html = run(fresh({bold: true, fontsize: 1.4, cursor: true, evil: true}));
    assert.deepEqual([...html.classList].sort(),
        ['existing', 'sis-a11y-pre', 'sis-a11y-pre-bold', 'sis-a11y-pre-cursor', 'sis-a11y-pre-fontsize']);
    assert.equal(html.style.getPropertyValue('--sis-pre-fontsize'), '1.4');
});
test('only the first saved colour mode is used, matching the widget', () => {
    const html = run(fresh({deuteranopia: true, monochrome: true, darkcontrast: true, animations: true}));
    assert.ok(html.classList.contains('sis-a11y-pre-monochrome'));
    assert.ok(!html.classList.contains('sis-a11y-pre-darkcontrast'));
    assert.ok(!html.classList.contains('sis-a11y-pre-deuteranopia'));
    assert.ok(html.classList.contains('sis-a11y-pre-animations'));
});
test('tools the administrator disabled and out-of-range scales are ignored', () => {
    const html = run(fresh({bold: true, fontsize: 9}), {tools: ['fontsize']});
    assert.ok(!html.classList.contains('sis-a11y-pre-bold'));
    assert.equal(html.style.getPropertyValue('--sis-pre-fontsize'), '2');
    assert.equal(run(fresh({fontsize: 1})).classList.contains('sis-a11y-pre-fontsize'), false);
    assert.equal(run(fresh({fontsize: '2'})).classList.contains('sis-a11y-pre-fontsize'), false);
});
test('missing, expired, over-long, corrupt or foreign entries leave the page alone', () => {
    const untouched = html => assert.equal(html.className, 'existing');
    untouched(run(undefined));
    untouched(run({version: 1, expires: Date.now() - 1, state: {bold: true}}));
    untouched(run({version: 1, expires: Date.now() + 365 * 86400000, state: {bold: true}}));
    untouched(run({version: 2, expires: Date.now() + 1000, state: {bold: true}}));
    untouched(run({version: 1, expires: Date.now() + 1000, state: [true]}));
    untouched(run('{'));
    untouched(run('x'.repeat(5000)));
    untouched(run(JSON.stringify(fresh({bold: true})), {key: KEY + ':other'}));
});
test('blocked storage never throws', () => {
    assert.doesNotThrow(() => run(undefined, {storage: () => {
        throw new Error('denied');
    }}));
});
test('the template prints its values unescaped only for JSON literals and renders nothing without a key', () => {
    assert.match(template, /\{\{#key\}\}[\s\S]*<script>[\s\S]*<\/script>\s*\{\{\/key\}\}/);
    assert.match(template, /\{\{\{filters\}\}\}\s*\{\{#key\}\}/);
    const unescaped = [...template.matchAll(/\{\{\{(\w+)\}\}\}/g)].map(match => match[1]).sort();
    assert.deepEqual(unescaped, ['colours', 'filters', 'key', 'tools']);
});
