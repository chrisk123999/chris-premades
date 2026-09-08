import {actorUtils, DamageBonus, dialogUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function validate({rollTotal, bonus, workflow, otherBonuses}) {
    console.log(otherBonuses);
    console.log(otherBonuses.find(otherBonus => otherBonus.identifier === 'sneakAttack')?.active);
    return otherBonuses.find(otherBonus => otherBonus.identifier === 'sneakAttack')?.active;
}
async function use({workflow, bonus, otherBonuses}) {
    const isBloodied = actorUtils.isBloodied(workflow.actor);
    let selection;
    if (isBloodied) {
        const activities = bonus.document.system.activities;
        selection = await dialogUtils.selectDocumentDialog(bonus.document.name, '', activities);
    } else {
        selection = itemUtils.getActivityByIdentifier(bonus.document, 'restore');
    }
    if (!selection) return;
    await workflowUtils.completeActivityUse(selection, [workflow.token.document]);
}
async function bonus({workflow, document}) {
    const canSneak = workflowUtils.getWorkflowProperty(workflow, 'canSneak');
    console.log(canSneak);
    if (!canSneak) return;
    return new DamageBonus(document, {action: 'special'}).withValidation(validate).withOnUse(use);  
}
export const stealBlood = {
    name: 'Steal Blood',
    version: '2.0.2',
    rules: '2024',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            phase: 'postResult',
            macro: bonus,
            priority: 255
        }
    ]
};