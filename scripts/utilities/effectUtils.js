function getCastData(effect) {
    return effect.flags['chris-premades']?.castData ?? effect.flags['midi-qol']?.castData;
}
function getCastLevel(effect) {
    return getCastData(effect)?.castLevel;
}
function getBaseLevel(effect) {
    return getCastData(effect)?.baseLevel;
}
async function setCastData(effect, data) {
    await effect.setFlag('chris-premades', 'castData', data);
}
async function setCastLevel(effect, level) {
    let data = getCastData(effect) ?? {};
    data.castLevel = level;
    await setCastData(effect, data);
}
async function setBaseLevel(effect, level) {
    let data = getCastData(effect) ?? {};
    data.baseLevel = level;
    await setCastData(effect, data);
}
function getSaveDC(effect) {
    return getCastData(effect)?.castDC;
}
async function setSaveDC(effect, dc) {
    let data = getCastData(effect) ?? {};
    data.saveDC = dc;
    await setCastData(effect, data);
}
export let effectUtils = {
    getCastData,
    getCastLevel,
    getBaseLevel,
    setCastData,
    setCastLevel,
    setBaseLevel,
    getSaveDC,
    setSaveDC
};