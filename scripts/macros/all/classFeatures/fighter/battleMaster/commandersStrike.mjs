import {actorUtils, dialogUtils, documentUtils, effectUtils, queryUtils, rollUtils, tokenUtils} from '../../../../../proxy.mjs';
async function command({workflow}) {
    const activity = workflow.activity;
    const token = workflow.token?.document;
    if (!token) return;
    let ally = workflow.targets.documents.find(other => other !== token && other.actor);
    if (!ally) {
        const allies = token.parent.tokens.filter(other => {
            if (other === token || !other.actor || other.disposition !== token.disposition) return false;
            if (actorUtils.hasUsedReaction(other.actor)) return false;
            return !other.object || !token.object || tokenUtils.canSee(other, token);
        });
        if (!allies.length) return;
        ally = allies.length > 1 ? (await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.CommanderSelect', allies))?.result : allies[0];
    }
    if (!ally?.actor || actorUtils.hasUsedReaction(ally.actor)) return;
    if (!await dialogUtils.confirm(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.CommanderConfirm', {userId: queryUtils.firstOwner(ally.actor, true)})) return;
    const amount = String(rollUtils.getRollsTotal(workflow.utilityRolls ?? []));
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.uuid,
        duration: {value: 1, units: 'turns'},
        specialDuration: ['1Attack'],
        changes: ['mwak', 'rwak'].map(type => ({key: 'system.bonuses.' + type + '.damage', type: 'add', value: amount, phase: 'initial', priority: 20}))
    });
    await effectUtils.createEffects(ally.actor, [effectData]);
    await actorUtils.setReactionUsed(ally.actor);
}
export const commandersStrike = {
    name: 'Maneuvers: Commander\'s Strike',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: command,
            priority: 50
        }
    ]
};
