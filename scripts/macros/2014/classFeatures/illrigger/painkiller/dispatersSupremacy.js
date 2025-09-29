import {effectUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.actor || !workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.targets.first().actor, 'balefulInterdictEffect');
    if (!effect) return;
    let sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = {seconds: 1};
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {animate: false});
}
export let dispatersSupremacy = {
    name: 'Dispater\'s Interdiction: Dispater\'s Supremacy (Passive)',
    aliases: ['Dispater\'s Interdiction: Dispater\'s Supremacy'],
    version: '1.3.77',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};