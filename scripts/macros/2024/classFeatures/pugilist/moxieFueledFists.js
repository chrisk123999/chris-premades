import {activityUtils, constants, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = itemUtils.getConfig(item, 'validateWeaponType');
    if (validateWeaponType && !(constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item)) || workflow.item.system.type.value === 'improv')) return;
    let base = workflow.activity.damage.parts[0].toObject();
    let changedType = itemUtils.getConfig(item, 'damageType') ?? 'force';
    let newTypes = itemUtils.getConfig(item, 'changeDamageType') ? [changedType] : base.types;
    let activityData = activityUtils.withChangedDamage(workflow.activity, base, newTypes);
    workflow.item = itemUtils.cloneItem(workflow.item, {
        ['system.activities.' + workflow.activity.id]: activityData
    });
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let moxieFueledFists = {
    name: 'Moxie Fueled Fists',
    version: '1.4.27',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    },   
    config: [
        {
            value: 'validateWeaponType',
            label: 'CHRISPREMADES.Macros.MartialArts.ValidateWeaponType',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'changeDamageType',
            label: 'CHRISPREMADES.Macros.AwakenedSpellbook.Select',
            type: 'checkbox',
            default: 'true',
            category: 'mechanics'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'force',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
