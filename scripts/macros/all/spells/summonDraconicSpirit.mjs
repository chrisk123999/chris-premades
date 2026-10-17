import {dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils} from '../../../proxy.mjs';
async function preCreate({document, summon, updates}) {
    const sourceActor = await summon.getSourceActor();
    const types = Array.from(genericUtils.getProperty(updates, 'system.traits.dr.value') ?? sourceActor.system.traits.dr.value);
    if (!types.length) return;
    const buttons = types.map(type => [CONFIG.DND5E.damageTypes[type]?.label ?? type, type]);
    const choice = await dialogUtils.buttonDialog(document.name, 'CHRISPREMADES.Macros.All.SummonDraconicSpirit.ResistanceType', buttons, {userId: queryUtils.firstOwner(summon.owner, true)}) ?? types[0];
    if (documentUtils.getRules(document) === '2024') {
        updates.items?.filter(itemData => itemData.system?.identifier === 'summon-draconic-spirit-breath-weapon').forEach(itemData => Object.values(itemData.system.activities).forEach(activityData => activityData.damage?.parts?.forEach(part => part.types = [choice])));
    }
    const effectData = {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        system: {changes: [{key: 'system.traits.dr.value', type: 'add', value: choice, priority: 20}]}
    };
    const effects = await effectUtils.createEffects(summon.owner, [effectData]);
    if (summon.parent && effects?.length) await documentUtils.makeDependent(summon.parent, effects);
}
export const summonDraconicSpirit = {
    name: 'Summon Draconic Spirit',
    version: '2.1.3',
    rules: 'all',
    summon: [
        {pass: 'preCreate', macro: preCreate, priority: 50}
    ]
};
