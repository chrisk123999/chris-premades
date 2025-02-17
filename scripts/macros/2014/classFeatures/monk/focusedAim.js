import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
    let targetToken = workflow.targets.first();
    let attackTotal = workflow.attackTotal;
    if (targetToken.actor.system.attributes.ac.value <= attackTotal) return;
    let ki = itemUtils.getItemByIdentifier(workflow.actor, 'ki');
    if (!ki) return;
    let uses = ki.system.uses.value;
    if (!uses) return;
    let buttons = [];
    for (let i = 1; i <= Math.min(uses, 3); i++) {
        buttons.push([genericUtils.format('CHRISPREMADES.Macros.FocusedAim.Bonus', {kiCost: i, bonus: i * 2}), i]);
    }
    buttons.push(['CHRISPREMADES.Generic.No', false]);
    let useFeature = await dialogUtils.buttonDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal, itemName: item.name}), buttons);
    if (!useFeature) return;
    await workflowUtils.bonusAttack(workflow, String(useFeature * 2));
    await genericUtils.update(ki, {'system.uses.spent': ki.system.uses.spent + useFeature});
    await workflowUtils.completeItemUse(item);
}
export let focusedAim = {
    name: 'Focused Aim',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            }
        ]
    }
};