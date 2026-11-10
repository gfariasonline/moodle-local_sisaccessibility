import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createAids} from '../../amd/src/aids.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const setup = html => {
    const dom = new JSDOM('<body>' + html + '<div id="sis-a11y-root"></div></body>', {url: 'https://example.test/moodle'});
    const {window: win} = dom;
    const doc = win.document;
    const aids = createAids(doc, {root: doc.getElementById('sis-a11y-root')});
    return {dom, win, doc, aids};
};
const fire = (win, target, type) => target.dispatchEvent(new win.Event(type, {bubbles: true}));

test('hideimages hides img, picture and CSS background images without touching layout, widget or icons', async () => {
    const {doc, aids} = setup('<main><img id="a" src="a.png" width="40" height="30"><picture><source srcset="b.png">' +
        '<img id="b" src="b.png"></picture><div id="bg" style="background-image:url(c.png);width:50px">Texto</div>' +
        '<div id="grad" style="background-image:linear-gradient(red,blue)">G</div><img id="icon" class="icon" src="i.png">' +
        '<div contenteditable="true"><img id="ed" src="e.png"></div></main>' +
        '<div id="sis-a11y-root"><img id="w" src="w.png"></div>');
    const attr = id => doc.getElementById(id).getAttribute('data-sis-a11y-image');
    const styleBefore = doc.getElementById('a').getAttribute('style');
    aids.apply({hideimages: true});
    assert.ok(doc.documentElement.classList.contains('sis-a11y-hideimages'));
    assert.equal(attr('a'), 'img');
    assert.equal(attr('b'), 'img');
    assert.equal(attr('bg'), 'bg');
    assert.equal(attr('grad'), null, 'gradients are not image content');
    assert.equal(attr('icon'), null);
    assert.equal(attr('ed'), null);
    assert.equal(attr('w'), null);
    assert.equal(doc.getElementById('a').getAttribute('style'), styleBefore, 'no inline style/layout change');
    assert.equal(doc.getElementById('a').getAttribute('width'), '40');
    assert.equal(doc.getElementById('bg').getAttribute('style'), 'background-image:url(c.png);width:50px');
    assert.equal(doc.querySelectorAll('style').length, 0);
    const added = doc.createElement('img');
    added.id = 'ajax';
    doc.querySelector('main').append(added);
    await wait(20);
    assert.equal(attr('ajax'), 'img', 'AJAX-inserted images are hidden too');
    aids.apply({hideimages: false});
    assert.equal(doc.querySelectorAll('[data-sis-a11y-image]').length, 0);
    assert.ok(!doc.documentElement.classList.contains('sis-a11y-hideimages'));
    const later = doc.createElement('img');
    doc.querySelector('main').append(later);
    await wait(20);
    assert.equal(later.getAttribute('data-sis-a11y-image'), null, 'observer disconnected after reset');
    aids.destroy();
});

test('image tooltips show alt on hover and keyboard focus, are non-interactive and leave title alone', async () => {
    const {win, doc, aids} = setup('<main><img id="i" alt="Mapa do campus" title="Titulo original" src="m.png">' +
        '<a id="l" href="#"><img alt="Logotipo" src="l.png"></a><img id="deco" alt="" src="d.png"></main>');
    aids.apply({imagetooltips: true});
    const tip = () => doc.querySelector('.sis-a11y-image-tip');
    assert.equal(tip(), null);
    fire(win, doc.getElementById('i'), 'pointerover');
    assert.equal(tip().textContent, 'Mapa do campus');
    assert.equal(tip().getAttribute('role'), 'tooltip');
    assert.equal(tip().style.pointerEvents, 'none');
    assert.equal(doc.getElementById('i').getAttribute('title'), 'Titulo original');
    assert.equal(doc.getElementById('i').getAttribute('alt'), 'Mapa do campus');
    fire(win, doc.getElementById('i'), 'pointerout');
    assert.equal(tip(), null);
    doc.getElementById('l').focus();
    assert.equal(tip().textContent, 'Logotipo', 'keyboard focus on a linked image shows its alt');
    doc.getElementById('l').blur();
    assert.equal(tip(), null);
    fire(win, doc.getElementById('deco'), 'pointerover');
    assert.equal(tip(), null, 'decorative images show nothing');
    fire(win, doc.getElementById('i'), 'pointerover');
    doc.dispatchEvent(new win.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert.equal(tip(), null, 'Escape dismisses');
    fire(win, doc.getElementById('i'), 'pointerover');
    aids.apply({});
    assert.equal(tip(), null);
    fire(win, doc.getElementById('i'), 'pointerover');
    doc.getElementById('l').focus();
    assert.equal(tip(), null, 'listeners removed');
    aids.destroy();
});

test('obsolete tools are ignored without accessing speech APIs or creating removed UI', () => {
    const {win, doc, aids} = setup('<main><p>Conteudo</p></main>');
    for (const key of ['speechSynthesis', 'SpeechSynthesisUtterance']) {
        Object.defineProperty(win, key, {get() { throw new Error('Removed speech API must not be accessed'); }});
    }
    assert.deepEqual(Object.keys(aids).sort(), ['apply', 'destroy', 'reset']);
    aids.apply({superfocus: true, screenreader: true, pagestructure: true, pdfreader: true, bold: true});
    assert.equal(doc.documentElement.className, '');
    assert.equal(doc.getElementById('sis-a11y-root').childElementCount, 0);
    assert.equal(doc.querySelectorAll('#sis-a11y-aids,.sis-a11y-structure').length, 0);
    aids.reset();
    aids.destroy();
});

test('reset and destroy clear image changes and disconnect listeners and observers', async () => {
    for (const exit of ['reset', 'destroy']) {
        const {win, doc, aids} = setup('<main><img id="image" alt="Imagem" src="a.png"></main>');
        const image = doc.getElementById('image');
        aids.apply({hideimages: true, imagetooltips: true});
        aids.apply({hideimages: true, imagetooltips: true});
        fire(win, image, 'pointerover');
        assert.equal(doc.querySelectorAll('.sis-a11y-image-tip').length, 1, 'repeated apply is idempotent');
        assert.equal(image.getAttribute('data-sis-a11y-image'), 'img');
        aids[exit]();
        aids[exit]();
        assert.equal(doc.documentElement.className, '');
        assert.equal(doc.querySelector('[data-sis-a11y-image],.sis-a11y-image-tip'), null);
        fire(win, image, 'pointerover');
        const added = doc.createElement('img');
        doc.querySelector('main').append(added);
        await wait(20);
        assert.equal(added.getAttribute('data-sis-a11y-image'), null);
        assert.equal(doc.querySelector('.sis-a11y-image-tip'), null);
        aids.destroy();
    }
});

test('image descriptions exclude widget content, editor images and Moodle icons', () => {
    const {win, doc, aids} = setup('<main><img id="icon" class="icon" alt="Icone" src="i.png">' +
        '<div contenteditable="true"><img id="editor" alt="Privado" src="e.png"></div></main>');
    const widgetImage = doc.createElement('img');
    widgetImage.alt = 'Widget';
    doc.getElementById('sis-a11y-root').append(widgetImage);
    aids.apply({imagetooltips: true});
    for (const image of [doc.getElementById('icon'), doc.getElementById('editor'), widgetImage]) {
        fire(win, image, 'pointerover');
        assert.equal(doc.querySelector('.sis-a11y-image-tip'), null);
    }
    aids.destroy();
});

const media = (win, tag, props = {}) => {
    const element = win.document.createElement(tag);
    let paused = props.paused ?? true;
    let muted = props.muted ?? false;
    element.pause = () => {
        paused = true;
    };
    element.start = () => {
        paused = false;
    };
    Object.defineProperty(element, 'paused', {get: () => paused, configurable: true});
    Object.defineProperty(element, 'muted', {get: () => muted, set: value => {
        muted = value;
        element.dispatchEvent(new win.Event('volumechange', {bubbles: false}));
    }, configurable: true});
    if (props.autoplay) {
        element.setAttribute('autoplay', '');
    }
    return element;
};
// Media events do not bubble, so a capture listener on the document is what sees them.
const emit = (win, target, type) => target.dispatchEvent(new win.Event(type, {bubbles: false}));

test('pausemedia stops playing media, drops autoplay and blocks playback nobody asked for', async () => {
    const {win, doc, aids} = setup('<main></main>');
    const playing = media(win, 'video', {paused: false, autoplay: true});
    const idle = media(win, 'audio');
    doc.querySelector('main').append(playing, idle);
    aids.apply({pausemedia: true});
    assert.equal(playing.paused, true);
    assert.equal(playing.hasAttribute('autoplay'), false);
    // A script starts a video with no user gesture: it is stopped again.
    idle.start();
    emit(win, idle, 'play');
    assert.equal(idle.paused, true);
    // Media added later (AJAX) with autoplay is stopped too.
    const added = media(win, 'video', {paused: false, autoplay: true});
    doc.querySelector('main').append(added);
    await wait(20);
    assert.equal(added.paused, true);
    // The user presses play: allowed.
    fire(win, doc.body, 'pointerdown');
    const wanted = media(win, 'video');
    doc.querySelector('main').append(wanted);
    await wait(20);
    wanted.start();
    emit(win, wanted, 'play');
    assert.equal(wanted.paused, false, 'user-initiated playback is respected');
    aids.apply({pausemedia: false});
    assert.equal(playing.hasAttribute('autoplay'), true, 'autoplay attribute restored');
    aids.destroy();
});
test('pausemedia respects the Moodle widget and uses the browser user activation when available', () => {
    const {win, doc, aids} = setup('<main></main>');
    const own = media(win, 'audio', {paused: false});
    doc.getElementById('sis-a11y-root').append(own);
    let active = false;
    Object.defineProperty(win.navigator, 'userActivation', {get: () => ({isActive: active}), configurable: true});
    const player = media(win, 'video');
    doc.querySelector('main').append(player);
    aids.apply({pausemedia: true});
    assert.equal(own.paused, false, 'widget media is never touched');
    player.start();
    emit(win, player, 'play');
    assert.equal(player.paused, true);
    // The browser's activation alone is not enough without a gesture in our own short window...
    active = true;
    player.start();
    emit(win, player, 'play');
    assert.equal(player.paused, true);
    // ...and a gesture the browser does not recognise as activation is not enough either.
    fire(win, doc.body, 'pointerdown');
    active = false;
    emit(win, player, 'play');
    assert.equal(player.paused, true);
    active = true;
    player.start();
    emit(win, player, 'play');
    assert.equal(player.paused, false);
    aids.destroy();
});
test('pausemedia freezes animated GIFs on their first frame and restores them', async () => {
    const {win, doc, aids} = setup('<main><img id="g" src="https://example.test/a.gif" srcset="a.gif 1x, b.gif 2x">' +
        '<img id="p" src="https://example.test/a.png"><img id="late" src="https://example.test/late.gif"></main>');
    const loaded = id => {
        const image = doc.getElementById(id);
        Object.defineProperty(image, 'complete', {get: () => true, configurable: true});
        Object.defineProperty(image, 'naturalWidth', {get: () => 10, configurable: true});
        return image;
    };
    const gif = loaded('g');
    loaded('p');
    const snapshots = [];
    const instance = createAids(doc, {root: doc.getElementById('sis-a11y-root'), snapshot: image => {
        snapshots.push(image.id);
        return 'data:image/png;base64,STILL';
    }});
    instance.apply({pausemedia: true});
    assert.deepEqual(snapshots, ['g'], 'only GIFs are frozen');
    assert.equal(gif.getAttribute('src'), 'data:image/png;base64,STILL');
    assert.equal(gif.hasAttribute('srcset'), false);
    const late = doc.getElementById('late');
    assert.equal(late.getAttribute('src'), 'https://example.test/late.gif', 'an image that has not loaded yet is left alone');
    loaded('late');
    late.dispatchEvent(new win.Event('load'));
    assert.deepEqual(snapshots, ['g', 'late']);
    // A page that replaces the image while the tool is on keeps its own choice.
    late.setAttribute('src', 'https://example.test/other.gif');
    instance.apply({pausemedia: false});
    assert.equal(late.getAttribute('src'), 'https://example.test/other.gif');
    assert.equal(gif.getAttribute('src'), 'https://example.test/a.gif');
    assert.equal(gif.getAttribute('srcset'), 'a.gif 1x, b.gif 2x');
    instance.destroy();
    aids.destroy();
});
test('pausemedia leaves a cross-origin GIF alone when its pixels cannot be read', () => {
    const {doc} = setup('<main><img id="x" src="https://other.test/x.gif"></main>');
    const image = doc.getElementById('x');
    Object.defineProperty(image, 'complete', {get: () => true, configurable: true});
    Object.defineProperty(image, 'naturalWidth', {get: () => 10, configurable: true});
    const instance = createAids(doc, {root: doc.getElementById('sis-a11y-root'), snapshot: () => {
        throw new Error('tainted canvas');
    }});
    assert.doesNotThrow(() => instance.apply({pausemedia: true}));
    assert.equal(image.getAttribute('src'), 'https://other.test/x.gif');
    instance.apply({pausemedia: false});
    assert.equal(image.getAttribute('src'), 'https://other.test/x.gif');
    instance.destroy();
});
test('silencemedia mutes every player, keeps them muted and restores the original state', async () => {
    const {win, doc, aids} = setup('<main></main>');
    const loud = media(win, 'video');
    const quiet = media(win, 'audio', {muted: true});
    doc.querySelector('main').append(loud, quiet);
    aids.apply({silencemedia: true});
    assert.equal(loud.muted, true);
    assert.equal(quiet.muted, true);
    loud.muted = false;
    assert.equal(loud.muted, true, 'the page cannot unmute while the tool is on');
    const added = media(win, 'video');
    doc.querySelector('main').append(added);
    await wait(20);
    assert.equal(added.muted, true);
    aids.apply({silencemedia: false});
    assert.equal(loud.muted, false);
    assert.equal(quiet.muted, true, 'already-muted players stay muted');
    assert.equal(added.muted, false);
    loud.muted = true;
    loud.muted = false;
    assert.equal(loud.muted, false, 'no listener is left after switching off');
    aids.destroy();
});
