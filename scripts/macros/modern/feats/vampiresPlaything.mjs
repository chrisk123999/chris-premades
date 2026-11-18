import {dialogUtils, documentUtils, genericUtils, itemUtils, queryUtils} from '../../../proxy.mjs';
import {findItem} from '../../all/equipment/robeOfUsefulItems.mjs';
async function decant({document: activity, workflow}) {
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'vampiresPlaythingDecanting', {multiple: true})?.at(-1);
    if (!effect) return;
    const buttons = [['CHRISPREMADES.Macros.Modern.VampiresPlaything.PotionOfHealing', 'potion-of-healing'], ['CHRISPREMADES.Macros.Modern.VampiresPlaything.Antitoxin', 'antitoxin']];
    const selection = await dialogUtils.buttonDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.VampiresPlaything.Select', buttons, {userId: queryUtils.firstOwner(workflow.actor, true)});
    if (!selection) return;
    const uuid = await findItem(selection, '2024');
    const source = uuid ? await fromUuid(uuid) : undefined;
    if (!source) {
        genericUtils.notify('CHRISPREMADES.Macros.Modern.VampiresPlaything.Missing', {type: 'warn'});
        return;
    }
    const itemData = source.toObject();
    itemData.system.quantity = 1;
    await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, parentEntity: effect});
}
export const vampiresPlaything = {
    name: 'Vampire\'s Plaything',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: decant,
            priority: 50
        }
    ]
};
