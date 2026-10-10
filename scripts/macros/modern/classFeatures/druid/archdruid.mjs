import {actorUtils, documentUtils, genericUtils, itemUtils} from '../../../../proxy.mjs';
import {addItemRecovery} from '../../../generic/itemRecovery.mjs';
async function early({document}) {
    const spells = document.actor.system.spells ?? {};
    if (Object.values(spells).some(i => i.max > 0 && i.value < i.max)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.Archdruid.NoSpellSlots', {type: 'info'});
    return true;
}
async function added({document}) {
    const actor = document.actor;
    const wildShape = actorUtils.getItemByIdentifier(actor, 'wild-shape');
    if (!wildShape) return;
    await addItemRecovery(document, 'wild-shape', {period: 'initiative', type: 'formula', formula: '1 - sign(@item.uses.value)'});
    const archdruidActivity = itemUtils.getActivityByIdentifier(document, 'archdruid');
    if (!archdruidActivity) return;
    if (archdruidActivity.consumption.scaling.max === '') {
        await documentUtils.update(archdruidActivity, {'consumption.scaling.max': wildShape._source.system.uses.max});
    }
}
export const archdruid = {
    name: 'Archdruid',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'munched',
            macro: added,
            priority: 50
        }
    ]
};
