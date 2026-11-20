import {actorUtils, automationUtils, dialogUtils, workflowUtils} from '../../../../../proxy.mjs';
import {burnSeals, getSeals} from '../balefulInterdict.mjs';
async function hit({document: item, workflow}) {
    const target = workflow.hitTargets.documents[0];
    if (!target || workflow.isCritical || !item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const interdict = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    if (!interdict || !getSeals(target.actor, interdict).length) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    await workflowUtils.completeItemUse(item, [target]);
    workflow.isCritical = true;
    await burnSeals(interdict, target, 1, {multiplier: automationUtils.getConfigValues(item, ['multiplier']).multiplier});
}
export const deathstrike = {
    name: 'Deathstrike',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollComplete',
            macro: hit,
            priority: 300
        }
    ],
    config: {
        multiplier: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Config.Multiplier',
            category: 'homebrew'
        }
    }
};
