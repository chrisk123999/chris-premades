import {actorUtils, dialogUtils, documentUtils, effectUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function provoke({workflow}) {
    for (const token of workflow.failedSaves) {
        const actor = token.actor;
        if (!actor || actor.statuses.has('incapacitated')) continue;
        const victims = tokenUtils.findNearby(token.document, 5, {disposition: 'all'}).filter(other => other.disposition === token.document.disposition && other.actor !== actor);
        const weapons = actor.items.filter(item => item.type === 'weapon' && item.system.activities.some(activity => activity.type === 'attack'));
        if (!actorUtils.hasUsedReaction(actor) && victims.length && weapons.length) {
            const userId = queryUtils.firstOwner(workflow.actor, true);
            const victim = victims.length > 1 ? (await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.Antagonize.Victim', victims, {userId}))?.result : victims[0];
            const weapon = weapons.length > 1 ? await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.Antagonize.Weapon', weapons, {userId}) : weapons[0];
            if (victim && weapon) {
                await actorUtils.setReactionUsed(actor);
                await workflowUtils.completeActivityUse(weapon.system.activities.find(activity => activity.type === 'attack'), [victim], {userId: queryUtils.firstOwner(actor, true), consumeUsage: false, consumeResources: false, fast: true});
                continue;
            }
        }
        await effectUtils.createEffects(actor, [documentUtils.getEffectData(workflow.activity, 'antagonizeDisadv')]);
    }
}
export const antagonize = {
    name: 'Antagonize',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: provoke, priority: 50}
    ]
};
