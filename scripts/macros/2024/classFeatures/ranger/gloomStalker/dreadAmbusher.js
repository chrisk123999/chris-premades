import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function turnStart({trigger: {entity: item}}) {
    if (game.combat.round !== 1) return;
    await workflowUtils.completeItemUse(item);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.perTurnCheck(item, 'dreadAmbusher', false, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.DreadAmbusher.Use', {name: item.name}));
    if (!selection) return;
    genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1})
    let formula = itemUtils.getConfig(item, 'formula');
    let damageType = itemUtils.getConfig(item, 'damageType');
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    await combatUtils.setTurnCheck(item, 'dreadAmbusher');
}
export let dreadAmbusher = {
    name: 'Dread Ambusher',
    version: '1.3.81',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};