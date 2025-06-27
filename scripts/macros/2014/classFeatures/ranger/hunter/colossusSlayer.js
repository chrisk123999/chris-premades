import {constants} from '../../../../../lib/constants.js';
import {combatUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (!combatUtils.perTurnCheck(item, 'colossusSlayer')) return;
    if (workflow.targets.first().actor.system.attributes.hp.value >= workflow.targets.first().actor.system.attributes.hp.max) return;
    let formula = itemUtils.getConfig(item, 'formula');
    await workflowUtils.bonusDamage(workflow, formula, {damageType: workflow.defaultDamageType});
    if (combatUtils.inCombat()) await combatUtils.setTurnCheck(item, 'colossusSlayer');
    await workflowUtils.completeItemUse(item);
}
async function combatEnd({trigger}) {
    await combatUtils.setTurnCheck(trigger.entity, 'colossusSlayer', true);
}
export let colossusSlayer = {
    name: 'Colossus Slayer',
    aliases: ['Hunter\'s Prey: Colossus Slayer'],
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ],
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d8',
            category: 'homebrew',
            homebrew: true
        }
    ]
};