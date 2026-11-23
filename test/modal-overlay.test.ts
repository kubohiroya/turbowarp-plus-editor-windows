import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';

test('styles.css replaces the accent dialog backdrop with a translucent dark tone', async () => {
    const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
    const rule = /:root\s*\{\s*--ui-modal-overlay:\s*var\(--tw-modal-overlay,\s*rgba\(0,\s*0,\s*0,\s*0\.4\)\)\s*!important;\s*\}/;
    assert.match(css, rule);
});
