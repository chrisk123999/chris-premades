import {register} from 'node:module';
/** A value that absorbs any property access, call or construction, standing in for Foundry, CAT and dnd5e globals. */
const stub = new Proxy(function () {}, {
    get: (target, prop) => {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then' || typeof prop === 'symbol') return undefined;
        return stub;
    },
    apply: () => stub,
    construct: () => stub,
    has: () => true
});
globalThis.__docStub = stub;
String.prototype.capitalize ??= function () { return this.charAt(0).toUpperCase() + this.slice(1); };
String.prototype.titleCase ??= function () { return this.split(' ').map(word => word.capitalize()).join(' '); };
String.prototype.slugify ??= function () { return this.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
for (const name of ['foundry', 'CONFIG', 'CONST', 'game', 'Hooks', '_loc', 'canvas', 'ui', 'dnd5e', 'MidiQOL', 'Roll', 'ChatMessage', 'Actor', 'Item', 'ActiveEffect', 'Token', 'TokenDocument', 'Sequencer', 'Sequence', 'PIXI', 'fromUuid', 'fromUuidSync', 'socketlib', 'DAE', 'ClipperLib', 'Dialog', 'Application', 'FormApplication', 'Region', 'RegionDocument']) {
    globalThis[name] ??= stub;
}
register('./stubs.mjs', import.meta.url);
