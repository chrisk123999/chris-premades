import {genericUtils} from '../utils.js';
function noAnimation(...args) {
    if (!args[0].flags['chris-premades']?.effect?.noAnimation) return;
    switch (this.hook) {
        case 'preCreateActiveEffect': args[2].animate = false; break;
        case 'preDeleteActiveEffect': args[1].animate = false; break;
    }
}
async function checkInterdependentDeps(effect) {
    let chrisFlags = effect.flags?.['chris-premades'];
    if (!chrisFlags.interdependent) return;
    async function check(interdependentUuid) {
        let interdependentEntity = await fromUuid(interdependentUuid);
        if (!interdependentEntity) return;
        let currDependents = interdependentEntity.getDependents();
        if (!currDependents.length) await genericUtils.remove(interdependentEntity);
    }
    let parentEntityUuid = chrisFlags.parentEntityUuid;
    let concentrationEffectUuid = chrisFlags.concentrationEffectUuid;
    if (parentEntityUuid) await check(parentEntityUuid);
    if (concentrationEffectUuid) await check(concentrationEffectUuid);
}
export let effects = {
    noAnimation,
    checkInterdependentDeps
};