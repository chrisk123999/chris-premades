import {dialogUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
function log(src, id, msg, notify) {
    Logging.addMacroWarning(src, id, msg, {notify});
    return true;
}
async function attack({document: activity, macroClass: {identifier, source}}) {
    const weapons = activity.actor.itemTypes.weapon.filter(w => ['simpleM', 'martialM', 'unarmed'].includes(w.system.type.value));
    if (!weapons.length) return log(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', true);
    let selected = weapons[0];
    if (weapons.length > 1) {
        selected = await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.All.Retaliation', weapons, {displayTooltips: true});
        if (!selected) return log(source, identifier, `Retaliation exited early due to a declined weapon choice prompt. (actor) ${activity.actor.uuid}`);
    }
    await workflowUtils.specialItemUse(selected, [], activity.item);
}
export const retaliation = {
    name: 'Retaliation',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: attack,
            priority: 50
        }
    ]
};
