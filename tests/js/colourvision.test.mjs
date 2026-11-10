import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readMatrix, applyMatrix, colourVisionFilters} from '../../amd/src/colourvision.js';
import {createEffects} from '../../amd/src/effects.js';

const DEUTAN = '1 0 0 0 0 0.16279 0.725047 0.112165 0 0 0.454695 -0.645392 1.190697 0 0 0 0 0 1 0';
const svg = values => '<svg id="sis-a11y-filters"><defs><filter id="sis-a11y-deuteranopia"><feColorMatrix type="matrix" ' +
    `values="${values}"/></filter></defs></svg>`;

test('the matrix is read back from the SVG the server rendered, and malformed values are refused', () => {
    const doc = new JSDOM('<body>' + svg(DEUTAN) + '</body>').window.document;
    assert.deepEqual(readMatrix(doc, 'deuteranopia'), [[1, 0, 0], [0.16279, 0.725047, 0.112165], [0.454695, -0.645392, 1.190697]]);
    assert.equal(readMatrix(doc, 'protanopia'), null);
    ['1 0 0', DEUTAN + ' 1', DEUTAN.replace('0.16279', 'x'), ''].forEach(values => {
        const broken = new JSDOM('<body>' + svg(values) + '</body>').window.document;
        assert.equal(readMatrix(broken, 'deuteranopia'), null, values);
    });
    assert.deepEqual(Object.keys(colourVisionFilters), ['protanopia', 'deuteranopia', 'tritanopia']);
    assert.equal(colourVisionFilters.tritanopia, 'url(#sis-a11y-tritanopia)');
});
test('greys and white are unchanged because every row sums to one; colours move', () => {
    const doc = new JSDOM('<body>' + svg(DEUTAN) + '</body>').window.document;
    const matrix = readMatrix(doc, 'deuteranopia');
    [[255, 255, 255], [0, 0, 0], [128, 128, 128]].forEach(grey => {
        applyMatrix(grey, matrix).forEach((value, index) => assert.ok(Math.abs(value - grey[index]) < 0.5, String(grey)));
    });
    const [r, g, b] = applyMatrix([200, 60, 60], matrix);
    assert.ok(Math.abs(g - 60) > 5 || Math.abs(b - 60) > 5, 'red is shifted for a deuteranope');
    assert.ok(r > 0 && r < 256);
    assert.deepEqual(applyMatrix([10, 20, 30], null), [10, 20, 30]);
});
test('effects reference the filter, re-tint painted surfaces with the same matrix and restore everything', () => {
    const dom = new JSDOM('<body>' + svg(DEUTAN) + '<div id="bar" style="position:fixed;top:0">Menu</div>' +
        '<main style="background-color: rgb(200, 60, 60)"><p>Texto</p></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({deuteranopia: true});
    assert.equal(doc.querySelector('main').style.filter, 'url(#sis-a11y-deuteranopia)');
    assert.equal(doc.getElementById('sis-a11y-filters').getAttribute('style'), null, 'the definitions are never styled');
    effects.apply({monochrome: true});
    assert.equal(doc.querySelector('main').style.filter, 'grayscale(100%)');
    effects.reset();
    assert.equal(doc.querySelector('main').style.filter, '');
    assert.equal(doc.querySelector('main').getAttribute('style'), 'background-color: rgb(200, 60, 60)');
    effects.apply({tritanopia: true});
    assert.equal(doc.querySelector('main').style.filter, '', 'no tritanopia definition on this page');
    effects.destroy();
});
