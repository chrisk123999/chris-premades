import {actorUtils, constants, dialogUtils, effectUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function lion({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size || !constants.attacks.includes(workflowUtils.getActionType(workflow)) || !workflow.token) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: false}).filter(i => actorUtils.getEffects(i.actor).find(j => j.flags['chris-premades']?.powerOfTheWildsLion)).filter(k => k.document.id != workflow.targets.first().document.id);
    if (!nearbyTargets.length) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('DIS: ' + effect.name);
}
async function ram({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflowUtils.getActionType(workflow) != 'mwak') return;
    if (effectUtils.getEffectByStatusID(workflow.hitTargets.first().actor, 'prone')) return;
    if (actorUtils.getSize(workflow.hitTargets.first().actor, false) > 3) return;
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.PowerOfTheWilds.RamProne');
    if (!selection) return;
    await effectUtils.applyConditions(workflow.targets.first().actor, ['prone']);
}
export let powerOfTheWilds = {
    name: 'Power of the Wilds',
    version: '1.1.23',
    rules: 'modern'
};
export let powerOfTheWildsLion = {
    name: powerOfTheWilds.name,
    version: powerOfTheWilds.version,
    rules: powerOfTheWilds.rules,
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: lion,
                priority: 50
            }
        ]
    }
};
export let powerOfTheWildsRam = {
    name: powerOfTheWilds.name,
    version: powerOfTheWilds.version,
    rules: powerOfTheWilds.rules,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: ram,
                priority: 250
            }
        ]
    }
};