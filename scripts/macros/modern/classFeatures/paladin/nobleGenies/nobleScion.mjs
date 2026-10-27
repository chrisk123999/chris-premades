import {actorUtils, dialogUtils, itemUtils, queryUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function useWish(item, targetToken, name, total) {
    if (!actorUtils.getEffectByIdentifier(item.actor, 'nobleScion')) return;
    if (item.actor.statuses.has('incapacitated') || actorUtils.hasUsedReaction(item.actor)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'minor-wish');
    if (!activity) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirmUseForRollTotal(activity, name, total, {userId})) return;
    return !!await workflowUtils.syntheticActivityRoll(activity, [targetToken], {userId});
}
async function succeed(roll, target) {
    if (roll.isFumble) rollUtils.replaceD20(roll, 2);
    const shortfall = target - roll.total;
    return shortfall > 0 ? await rollUtils.addToRoll(roll, shortfall) : roll;
}
async function d20Test({document: item, roll, token}) {
    if (!Number.isNumeric(roll.options.target) || roll.isSuccess) return;
    if (!await useWish(item, token, token.actor.name, roll.total)) return;
    return succeed(roll, roll.options.target);
}
async function attack({document: item, workflow}) {
    if (!workflow.attackRoll || !workflow.token || workflow.targets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const armorClass = workflow.targets.first().actor?.system.attributes.ac.value;
    if (armorClass === undefined) return;
    if (workflow.attackRoll.total >= armorClass && !workflow.attackRoll.isFumble) return;
    if (!await useWish(item, workflow.token.document, workflow.item.name, workflow.attackRoll.total)) return;
    await workflow.setAttackRoll(await succeed(workflow.attackRoll, armorClass));
}
const bonusPass = [
    {
        pass: 'nearbyBonus',
        macro: d20Test,
        priority: 450,
        configDistance: 'distance',
        dispositions: ['ally']
    }
];
export const nobleScion = {
    name: 'Noble Scion',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'nearbyAttackRoll',
            macro: attack,
            priority: 850,
            configDistance: 'distance',
            dispositions: ['ally']
        }
    ],
    check: bonusPass,
    save: bonusPass,
    skill: bonusPass,
    tool: bonusPass,
    config: {
        distance: {
            default: '10 + 20 * floor(@classes.paladin.levels / 18)',
            type: 'text',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.Modern.NobleScion.DistanceHint',
            category: 'behavior'
        }
    }
};
