import {activityUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function added({trigger: {entity: item, actor}}) {
    let wildShape = itemUtils.getItemByIdentifier(actor, 'wildShape');
    if (!wildShape) return;
    if (!wildShape.system.uses.recovery.find(i => i.period === 'initiative')) {
        let newRecovery = wildShape.toObject().system.uses.recovery;
        newRecovery.push({
            formula: '1 - sign(@item.uses.value)',
            period: 'initiative',
            type: 'formula'
        });
        await genericUtils.update(wildShape, {'system.uses.recovery': newRecovery});
    }
    let archdruidActivity = activityUtils.getActivityByIdentifier(item, 'archdruid');
    if (!archdruidActivity) return;
    if (archdruidActivity.consumption.scaling.max === '') {
        await genericUtils.update(archdruidActivity, {'consumption.scaling.max': wildShape._source.system.uses.max});
        await itemUtils.correctActivityItemConsumption(item, ['archdruid'], 'wildShape');
    }
}
export let archdruid = {
    name: 'Archdruid',
    version: '1.3.83',
    rules: 'modern',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};