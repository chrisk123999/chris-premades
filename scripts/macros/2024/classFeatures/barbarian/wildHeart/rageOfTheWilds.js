import {actorUtils, constants, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), 5, 'enemy', {includeIncapacitated: false}).filter(i => actorUtils.getEffects(i.actor).find(j => j.flags['chris-premades']?.rageOfTheWildsWolf)).filter(k => k.document.id != workflow.token.document.id);
    if (!nearbyTargets.length) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add('ADV: ' + item.name);
}
export let rageOfTheWilds = {
    name: 'Rage of the Wilds',
    version: '1.1.23',
    rules: 'modern'
};
export let rageOfTheWildsWolf = {
    name: rageOfTheWilds.name,
    version: rageOfTheWilds.version,
    rules: rageOfTheWilds.rules,
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};