import {activityUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function added({trigger: {entity: item, identifier, actor}}) {
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    if (!bardicInspiration.system.uses.recovery.find(i => i.period === 'sr')) {
        let itemData = genericUtils.duplicate(bardicInspiration.toObject());
        itemData.system.uses.recovery.push({
            formula: undefined,
            period: 'sr',
            type: 'recoverAll'
        });
        await genericUtils.update(bardicInspiration, {'system.uses.recovery': itemData.system.uses.recovery});
    }
    let activity = activityUtils.getActivityByIdentifier(item, 'recover', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].consumption.targets[0].target = bardicInspiration.id;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: itemData.system.activities[activity.id].consumption.targets});
}
export let fontOfInspiration = {
    name: 'Font of Inspiration',
    version: '1.1.30',
    rules: 'modern',
    createItem: [
        {
            pass: 'created',
            macro: added
        }
    ]
};