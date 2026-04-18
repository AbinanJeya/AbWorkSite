import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const workspace = 'C:/AbWork/AbWork-Website';
const controllerPath = path.join(workspace, 'hero-preview-controller.js');
const indexPath = path.join(workspace, 'index.html');

async function run() {
    assert.ok(fs.existsSync(controllerPath), 'expected hero-preview-controller.js to exist');

    const module = await import(pathToFileURL(controllerPath).href);
    assert.equal(typeof module.createHeroPreviewController, 'function');

    const controller = module.createHeroPreviewController([
        'dashboard',
        'diary',
        'advice',
        'workout',
        'profile',
    ]);

    assert.equal(controller.getActiveScreen(), 'dashboard');
    assert.equal(controller.isAutoRotateEnabled(), true);

    controller.advance();
    assert.equal(controller.getActiveScreen(), 'diary');

    controller.recordInteraction();
    assert.equal(controller.isAutoRotateEnabled(), false);

    controller.advance();
    assert.equal(controller.getActiveScreen(), 'diary');

    controller.select('profile');
    assert.equal(controller.getActiveScreen(), 'profile');
    assert.equal(controller.isAutoRotateEnabled(), false);

    controller.setScrollPosition('profile', 248);
    assert.equal(controller.getScrollPosition('profile'), 248);

    const html = fs.readFileSync(indexPath, 'utf8');

    assert.match(html, /data-fitai-preview/);
    assert.match(html, /class="fitai-screen[^"]*"/);
    assert.match(html, /class="fitai-nav__button[^"]*"/);
    assert.doesNotMatch(html, /class="app-shot"/);

    console.log('hero preview tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
