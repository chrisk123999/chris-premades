import {activityUtils, dialogUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attack({macroClass: {identifier, source}, workflow}) {
    if (!workflow.token)
        return Logging.addMacroWarning(source, identifier, `War Priest exited early without a placed token. (activity) ${workflow.activity.uuid}`);
    const weapons = workflow.actor.itemTypes.weapon.filter(w => w.system.equipped);
    if (!weapons.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', {notify: true});
    let weapon = weapons[0];
    if (weapons.length > 1) weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.ManifestEcho.Weapon', weapons, {displayTooltips: true});
    if (!weapon) return;
    let targets = workflow.targets.documents;
    if (!targets.length) {
        const activity = weapon.system.activities.getByType('attack')[0];
        if (!activity) return Logging.addMacroWarning(source, identifier, `War Priest exited early. The selected weapon has no attack activity. (weapon) ${weapon.uuid}`);
        const near = tokenUtils.findNearby(workflow.token.document, activityUtils.getRange(activity) ?? 0, {disposition: 'enemy'});
        if (!near.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.HuntersMark.NoTargets', {notify: true});
        const target = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectTarget', near, {skipDeadAndUnconscious: false});
        if (target?.result) targets = [target.result]; else return;
    }
    await workflowUtils.specialItemUse(weapon, targets, workflow.item);
}
export const warPriest = {
    name: 'War Priest',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: attack,
            priority: 50
        }
    ]
};
