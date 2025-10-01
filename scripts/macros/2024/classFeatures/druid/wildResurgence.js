import {genericUtils, itemUtils} from '../../../../utils.js';

async function early({actor}) {
    let wildShape = itemUtils.getItemByIdentifier(actor, 'wildShape');
    if (wildShape?.system.uses.value === 0) return;
    genericUtils.notify('CHRISPREMADES.Macros.WildResurgence.WildShapeUses', 'info');
    return true;
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['restoreWildShape', 'restoreSpellSlot'], 'wildShape');
}
export let wildResurgence = {
    name: 'Wild Resurgence',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['restoreWildShape']
            }
        ]
    },
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