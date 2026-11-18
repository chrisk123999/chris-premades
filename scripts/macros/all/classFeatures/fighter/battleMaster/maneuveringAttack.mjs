import {actorUtils, dialogUtils, queryUtils, tokenUtils} from '../../../../../proxy.mjs';
async function ally({workflow}) {
    const activity = workflow.activity;
    const token = workflow.token?.document;
    if (!token) return;
    const allies = token.parent.tokens.filter(other => {
        if (other === token || !other.actor || other.disposition !== token.disposition) return false;
        if (actorUtils.hasUsedReaction(other.actor)) return false;
        return !other.object || !token.object || tokenUtils.canSee(other, token);
    });
    if (!allies.length) return;
    const selected = allies.length > 1 ? (await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.ManeuveringSelect', allies))?.result : allies[0];
    if (!selected) return;
    if (!await dialogUtils.confirm(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.ManeuveringConfirm', {userId: queryUtils.firstOwner(selected.actor, true)})) return;
    await actorUtils.setReactionUsed(selected.actor);
}
export const maneuveringAttack = {
    name: 'Maneuvers: Maneuvering Attack',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: ally,
            priority: 50
        }
    ]
};
