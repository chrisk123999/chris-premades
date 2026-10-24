import {actorUtils, documentUtils, tokenUtils} from '../../../../../proxy.mjs';
async function attack({document: effect, macroClass: {identifier}, workflow}) {
    const target = workflow.targets.first()?.document;
    if (workflow.actor.statuses.has('deafened')) return;
    if (!target || target.actor.uuid === effect.actor.uuid) return;
    if (workflow.actor.system.traits.ci.value.has('frightened')) return;
    const self = actorUtils.getFirstToken(effect.actor);
    if (!self || !tokenUtils.canSee(workflow.token.document, self)) return;
    if (actorUtils.getEffectByIdentifier(target.actor, documentUtils.getIdentifier(effect))) return;
    workflow.tracker.disadvantage.add(identifier, effect.name);
}
export const bearAttunement = {
    name: 'Totemic Attunement: Bear',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'nearbyAttackRollConfig',
            macro: attack,
            priority: 500,
            dispositions: ['enemy'],
            distance: 5
        }
    ]
};
