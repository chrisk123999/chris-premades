import {itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflow.item.system.properties.has('thr')) return;
    if (!['', 'str'].includes(workflow.item.system.ability)) return;
    let isFinesse = workflow.item.system.properties.has('fin') && workflow.item.system.ability === '';
    if (isFinesse && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str.mod) return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.hitTargets.first());
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    if (distance <= (demiurgicColossus ? 15 : 10)) return;
    let formula = workflow.actor.system.scale.barbarian?.['rage-damage']?.value;
    if (!formula) return;
    await workflowUtils.bonusDamage(workflow, formula);
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'giantsHavocCrushingThrow');
    if (feature) await feature.displayCard();
}
export let giantsHavocCrushingThrow = {
    name: 'Giant\'s Havoc: Crushing Throw',
    version: '0.12.15',
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