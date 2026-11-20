import {actorUtils, dialogUtils, queryUtils, tokenUtils} from '../../../../../proxy.mjs';
import {offerAllyAttack} from '../../../../generic/allyAttack.mjs';
async function command({document: item, workflow}) {
    if (!workflow.token) return;
    const token = workflow.token.document;
    const allies = tokenUtils.findNearby(token, 30, {disposition: 'ally'}).filter(ally => ally.actor && tokenUtils.canSee(token, ally) && !actorUtils.hasUsedReaction(ally.actor));
    if (!allies.length) return;
    const selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.Devastator.Allies', allies, {type: 'multiple', maxAmount: item.actor.system.attributes.prof, userId: queryUtils.firstOwner(item.actor, true)});
    for (const ally of selection?.result ?? []) {
        if (await offerAllyAttack(item.name, ally, {cantrips: true})) await actorUtils.setReactionUsed(ally.actor);
    }
}
export const devastator = {
    name: 'Devastator',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: command,
            priority: 60
        }
    ]
};
