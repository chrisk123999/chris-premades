import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger, workflow}) {
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'divineFury');
    if (!item) return;
    if (!workflow.hitTargets.size || !constants.weaponAttacks.includes(workflow.activity.actionType) || !item.system.uses.value) return;
    let damageTypes = itemUtils.getConfig(item, 'damageTypes');
    if (!damageTypes.length) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = workflow.actor.classes[classIdentifier];
    if (!classItem) return;
    let selection = await dialogUtils.selectDamageType(damageTypes, item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) damageTypes[0];
    let barbarianLevel = classItem.system.levels;
    await workflowUtils.bonusDamage(workflow, '1d6 + ' + Math.floor(barbarianLevel / 2), {damageType: selection});
    if (combatUtils.inCombat()) await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
export let divineFury = {
    name: 'Divine Fury',
    version: '1.1.27',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['radiant', 'necrotic'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let divineFuryAttack = {
    name: divineFury.name,
    version: divineFury.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            }
        ]
    }
};