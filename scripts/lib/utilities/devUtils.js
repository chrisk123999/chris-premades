async function setMacro(entityUuid, key, values = []) {
    if (!key) return;
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    return await entity.setFlag('chris-premades', 'macros.' + key, values);
}
export let devUtils = {
    setMacro
};