async function setMacro(entityUuid, key = '', values = []) {
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    return await entity.setFlag('chris-premades', 'macros.' + key, values);
}
export let devUtils = {
    setMacro
};