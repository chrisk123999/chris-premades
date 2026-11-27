import {documentUtils} from '../../../../proxy.mjs';
async function damage({workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'unarmed-strike' || !workflow.damageRolls?.length) return;
    for (const roll of workflow.damageRolls) roll.options.properties = [...new Set([...(roll.options.properties ?? []), 'mgc'])];
    await workflow.setDamageRolls(workflow.damageRolls);
}
export const kiEmpoweredStrikes = {
    name: 'Ki-Empowered Strikes',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 50
        }
    ]
};
