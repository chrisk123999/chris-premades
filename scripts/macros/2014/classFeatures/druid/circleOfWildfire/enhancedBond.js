import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (!effectUtils.getEffectByIdentifier(workflow.actor, 'summonWildfireSpirit')) return;
    let matchingTypes = Array.from(workflowUtils.getDamageTypes(workflow.damageRolls).intersection(new Set(['fire', 'healing'])));
    if (!matchingTypes.lenth) return;
    let damageType;
    if (matchingTypes.length > 1) {
        damageType = await dialogUtils.buttonDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), [
            matchingTypes.map(i => [CONFIG.DND5E.damageTypes[i].label, i])
        ]);
    }
    if (!damageType) damageType = matchingTypes[0];
    await workflowUtils.bonusDamage(workflow, '1d8', {damageType});
}
export let enhancedBond = {
    name: 'Enhanced Bond',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};