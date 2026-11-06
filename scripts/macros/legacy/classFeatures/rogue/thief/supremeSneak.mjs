import {actorUtils, tokenUtils} from '../../../../../proxy.mjs';
function stealthAdvantage({actor, skillId, options}) {
    if (skillId !== 'ste') return;
    const token = actorUtils.getFirstToken(actor);
    if (token?.inCombat && tokenUtils.movementSpent(token) > (actor.system.attributes.movement.walk ?? 0) / 2) return;
    options.advantage = true;
}
export const supremeSneakLegacy = {
    name: 'Supreme Sneak',
    version: '2.1.8',
    rules: '2014',
    skill: [
        {
            pass: 'actorSituational',
            macro: stealthAdvantage,
            priority: 50
        }
    ]
};
