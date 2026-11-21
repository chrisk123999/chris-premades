/**
 * Tag all `Sequence()` calls with the module name.
 * @param {object|string} [options] Sequence options or a module name.
 * @param {...*} args Remaining Sequence constructor arguments.
 * @returns {Sequence}
 */
export default function Sequence(options = {}, ...args) {
    return new globalThis.Sequence(typeof options === 'string' ? options : {moduleName: 'chris-premades', ...options}, ...args);
}
