export function addDAEFlags() {
    let crFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CR.' + i);
    let cvFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CV.' + i);
    DAE.addAutoFields(crFlags.concat(cvFlags));
}