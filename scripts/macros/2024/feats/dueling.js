import {constants, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || workflow.attackMode === 'twoHanded' || !constants.meleeWeaponTypes.includes(workflow.item.system.type?.value)) return;
    let actor = workflow.actor;
    let items = actor.items.filter(i => i.system.equipped && i.type === 'weapon' && !constants.unarmedAttacks.includes(genericUtils.getIdentifier(i)));
    if (items.length > 1) return;
    let bonus = itemUtils.getConfig(item, 'formula');
    await workflowUtils.bonusDamage(workflow, bonus);
}
export let dueling = {
    name: 'Dueling',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 200
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};