import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalise, createPreferences} from '../../amd/src/preferences.js';

test('preferences reject unknown keys, invalid types and conflicting colours', () => {
    assert.deepEqual(normalise({fontsize: 99, bold: 'yes', monochrome: true, darkcontrast: true, evil: true},
        ['fontsize', 'bold', 'monochrome', 'darkcontrast']), {fontsize: 2, monochrome: true});
    assert.deepEqual(normalise({fontsize: NaN, bold: true}, []), {});
});
test('reset removes active key; blocked and corrupt storage degrade safely', () => {
    const data = new Map();
    const storage = {getItem: key => data.get(key), setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k),
        key: index => [...data.keys()][index], get length() { return data.size; }};
    const prefs = createPreferences('local_sisaccessibility:v1:one:session', ['bold'], true, storage);
    prefs.save({bold: true});
    assert.deepEqual(prefs.load(), {bold: true});
    assert.deepEqual(createPreferences('local_sisaccessibility:v1:two:session', ['bold'], true, storage).load(), {});
    prefs.reset();
    assert.equal(data.size, 0);
    storage.getItem = () => '{';
    assert.deepEqual(prefs.load(), {});
    storage.getItem = () => { throw new Error('denied'); };
    storage.setItem = storage.getItem;
    assert.doesNotThrow(() => prefs.save({bold: true}));
    assert.deepEqual(prefs.load(), {bold: true});
});
test('expired state is ignored and disabled persistence does not read storage', () => {
    const storage = {getItem: () => JSON.stringify({version: 1, expires: 1, state: {bold: true}}), removeItem() {}};
    assert.deepEqual(createPreferences('scope', ['bold'], true, storage).load(), {});
    assert.deepEqual(createPreferences('scope', ['bold'], false, {getItem() {throw Error();}}).load(), {});
});

test('removed tools are discarded from previously saved preferences', () => {
    const removed = ['superfocus', 'screenreader', 'pagestructure', 'pdfreader'];
    const oldState = Object.fromEntries(removed.map(key => [key, true]));
    assert.deepEqual(normalise({...oldState, guide: true}, [...removed, 'guide']), {guide: true});
});
