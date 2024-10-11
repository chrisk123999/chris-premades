import {constants} from '../../../../lib/constants.js';
import {combatUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.targets.size) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    if (!combatUtils.perTurnCheck(trigger.entity, 'colossusSlayer')) return;
    if (workflow.targets.first().actor.system.attributes.hp.value >= workflow.targets.first().actor.system.attributes.hp.max) return;
    let formula = itemUtils.getConfig(trigger.entity, 'formula');
    await workflowUtils.bonusDamage(workflow, formula + '[' + workflow.defaultDamageType + ']', {damageType: workflow.defaultDamageType});
    if (combatUtils.inCombat()) await combatUtils.setTurnCheck(trigger.entity, 'colossusSlayer');
    await trigger.entity.use();
}
async function combatEnd({trigger}) {
    await combatUtils.setTurnCheck(trigger.entity, 'colossusSlayer', true);
}
export let colossusSlayer = {
    name: 'Colossus Slayer',
    version: '1.0.14',
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