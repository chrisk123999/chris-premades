import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.activity) return;
    if (!constants.weaponAttacks.includes(workflowUtils.getActionType(workflow))) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.isOwnTurn(workflow.token)) return;
    let damageTypes = itemUtils.getConfig(item, 'damageTypes');
    if (!damageTypes.length) return;
    let selection = await dialogUtils.selectDamageType(damageTypes, item.name, genericUtils.format('CHRISPREMADES.Generic.UseItem', {item: item.name}), {addNo: true});
    if (!selection) return;
    let baseDiceNumber = itemUtils.getConfig(item, 'baseDiceNumber');
    if (itemUtils.getItemByIdentifier(workflow.actor, 'improvedBlessedStrikes')) baseDiceNumber += 1;
    let dieSize = itemUtils.getConfig(item, 'dieSize');
    await workflowUtils.bonusDamage(workflow, baseDiceNumber + dieSize, {damageType: selection});
    await workflowUtils.syntheticItemRoll(item, [], {consumeResources: true});
}
export let divineStrike = {
    name: 'Blessed Strikes: Divine Strike',
    version: '1.2.12',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete', 
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['radiant', 'necrotic'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'dieSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            options: constants.diceSizeOptions,
            default: 'd8',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'number',
            default: 1,
            category: 'homebrew',
            homebrew: true
        }
    ]
};