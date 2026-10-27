import {activityUtils, automationUtils, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const strikes = ['daos-crush', 'djinnis-escape', 'efreetis-fury', 'marids-surge'];
async function getTargets(item, token, target, identifier, userId) {
    if (identifier === 'daos-crush') return [target];
    if (identifier === 'djinnis-escape') return [token];
    const fury = identifier === 'efreetis-fury';
    const range = automationUtils.getConfigValue(item, fury ? 'furyRange' : 'surgeRange');
    const nearby = tokenUtils.findNearby(token, range).filter(nearbyToken => nearbyToken.actor && nearbyToken.id !== target.id && (!fury || tokenUtils.canSee(token, nearbyToken)));
    if (!nearby.length) return [target];
    const content = fury ? 'CHRISPREMADES.Macros.Modern.ElementalStrike.SelectFury' : 'CHRISPREMADES.Macros.Modern.ElementalStrike.SelectSurge';
    const selection = await dialogUtils.selectTargetDialog(item.name, content, nearby, {type: fury ? 'one' : 'multiple', maxAmount: nearby.length, skipDeadAndUnconscious: false, userId});
    if (!selection) return [target];
    return [target, ...[selection.result ?? []].flat()];
}
async function strike({actor, data: {activity, targets}, document: item, token}) {
    if (documentUtils.getIdentifier(activity.item) !== 'divine-smite') return;
    const target = targets[0];
    if (!token || !target) return;
    const activities = strikes.map(identifier => itemUtils.getActivityByIdentifier(item, identifier)).filter(Boolean);
    if (activities.length !== strikes.length) return Logging.addMacroWarning('CPR', 'elemental-strike', 'Elemental Strike activities are missing from the item.', {notify: 'warn'});
    if (!activityUtils.checkCosts(activities[0])) return;
    const userId = queryUtils.firstOwner(actor, true);
    const buttons = activities.map(strikeActivity => [strikeActivity.name, strikeActivity.id, {image: strikeActivity.img}]);
    const choice = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.ElementalStrike.Select', [...buttons, ['CAT.Generic.Cancel', false]], {userId});
    if (!choice) return;
    const chosen = item.system.activities.get(choice);
    const identifier = documentUtils.getIdentifier(chosen);
    const strikeTargets = await getTargets(item, token, target, identifier, userId);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    if (animation?.macros?.play) animation.macros.play(token, strikeTargets, identifier, options);
    await workflowUtils.syntheticActivityRoll(chosen, strikeTargets, {userId});
}
export const elementalStrike = {
    name: 'Elemental Strike',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorAttackRiderUsed',
            macro: strike,
            priority: 100
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'elementalStrike'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetTokens', 'strike'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        },
        furyRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.ElementalStrike.FuryRange',
            category: 'behavior'
        },
        surgeRange: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.ElementalStrike.SurgeRange',
            category: 'behavior'
        }
    }
};
