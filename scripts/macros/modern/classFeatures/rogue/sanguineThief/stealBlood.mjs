import {DamageBonus, workflowUtils} from '../../../../../proxy.mjs';
async function validate({rollTotal, bonus, workflow, otherBonuses}) {
    return otherBonuses.find(otherBonus => otherBonus.identifier === 'sneakAttack')?.active;
}
async function use({workflow, bonus, otherBonuses}) {

}
async function bonus({workflow, document}) {
    const canSneak = workflowUtils.getWorkflowProperty(workflow, 'canSneak');
    if (!canSneak) return;
    return new DamageBonus(document, {action: 'special'}).withValidation(validate);
}