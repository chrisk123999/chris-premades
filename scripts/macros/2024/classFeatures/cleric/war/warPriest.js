import {dialogUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let weapons = workflow.actor.items.filter(item => item.type === 'weapon' && item.system.equipped);
    let weapon;
    if (!weapons.length) {
        return;
    } else if (weapons.length === 1) {
        weapon = weapons[0];
    } else {
        weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAWeapon', weapons);
        if (!weapon) return;
    }
    let targets;
    if (!workflow.targets.size) {
        let activity = weapon.system.activities.find(i => i.type === 'attack');
        if (!activity) return;
        let nearby = tokenUtils.findNearby(workflow.token, activity.range.value, 'enemy', {includeIncapacitated: true});
        if (!nearby.length) return;
        targets = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
        if (!targets?.length) return;
        targets = [targets[0]];
    } else {
        targets = Array.from(workflow.targets);
    }
    await workflowUtils.specialItemUse(weapon, targets, workflow.item);
}
export let warPriest = {
    name: 'War Priest',
    version: '1.3.27',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};