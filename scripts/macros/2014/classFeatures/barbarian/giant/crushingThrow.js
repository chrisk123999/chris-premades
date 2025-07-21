import {genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function damage({workflow}) {
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'giantsHavocCrushingThrow');
    if (!item) return;
    if (workflow.hitTargets.size !== 1 || !workflow.item.system.properties.has('thr')) return;
    if (!['', 'str'].includes(workflow.activity.ability)) return;
    let isFinesse = workflow.item.system.properties.has('fin') && workflow.activity.ability === '';
    if (isFinesse && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str.mod) return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.hitTargets.first());
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    if (distance <= (demiurgicColossus ? genericUtils.handleMetric(15) : genericUtils.handleMetric(10))) return;
    let formula = workflow.actor.system.scale.barbarian?.['rage-damage']?.value;
    if (!formula) return;
    await workflowUtils.bonusDamage(workflow, formula);
    await workflowUtils.completeItemUse(item);
}
export let giantsHavocCrushingThrow = {
    name: 'Giant\'s Havoc: Crushing Throw',
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