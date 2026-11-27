import {dialogUtils, documentUtils, effectUtils, queryUtils} from '../../../../../proxy.mjs';
const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison'];
async function pick({activity, actor}) {
    if (activity.identifier !== 'resistance') return;
    const effect = activity.item.effects.find(entry => documentUtils.getIdentifier(entry) === 'aspectOfTheWyrmResistance');
    if (!effect) return;
    const type = await dialogUtils.selectDamageType(damageTypes, activity.item.name, 'CHRISPREMADES.Macros.Legacy.AspectOfTheWyrm.Resistance', {userId: queryUtils.firstOwner(actor, true)});
    if (!type) return true;
    await documentUtils.update(effect, {'system.changes': [{key: 'system.traits.dr.value', type: 'add', value: type, priority: 20}]});
}
async function presence({workflow}) {
    if (workflow.activity.identifier !== 'frightful') return;
    await effectUtils.createEffects(workflow.actor, [documentUtils.getBaseEffectData(workflow.activity, {
        name: workflow.activity.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        identifier: 'aspectOfTheWyrmPresence',
        duration: {value: 1, units: 'minutes'},
        unhideActivities: ['frighten'],
        activityUuid: workflow.activity.uuid
    })]);
}
export const aspectOfTheWyrm = {
    name: 'Aspect of the Wyrm',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: pick,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: presence,
            priority: 50
        }
    ]
};
