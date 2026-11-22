import {actorUtils, automationUtils, constants, dialogUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
const variants = {
    pullOnFail: {direction: -1, targets: 'failedSaves'},
    pullOnHit: {direction: -1, targets: 'hitTargets'},
    pushOnFail: {direction: 1, targets: 'failedSaves'},
    pushOnHit: {direction: 1, targets: 'hitTargets'}
};
async function getDistance(activity, config, sourceToken, targetToken, direction, maximum) {
    if (config.maxSize && actorUtils.getSize(targetToken.actor) > CONFIG.DND5E.actorSizes[config.maxSize]?.numerical) return 0;
    let limit = maximum;
    if (direction < 0 && config.stopAdjacent) {
        const distance = tokenUtils.getDistance(sourceToken, targetToken);
        if (Number.isFinite(distance)) limit = Math.min(limit, Math.floor((distance - 4) / 5) * 5);
    }
    if (limit <= 0) return 0;
    if (!config.choose) return limit;
    const steps = Array.from({length: Math.floor(limit / 5)}, (_, index) => (index + 1) * 5);
    if (!steps.length) return 0;
    return await dialogUtils.distanceDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Generic.PushOnFail.Prompt', {target: targetToken.name}), steps, {none: _loc('CHRISPREMADES.Config.None'), scene: sourceToken.parent});
}
async function moveTarget(activity, config, sourceToken, targetToken, direction, maximum, {animation, options}, damageType) {
    const distance = await getDistance(activity, config, sourceToken, targetToken, direction, maximum);
    let moved = false;
    const move = distance ? async () => {
        if (moved) return;
        moved = true;
        await tokenUtils.slideToken(targetToken, {sourceToken, distance: direction * distance});
    } : undefined;
    if (animation?.macros?.play) await animation.macros.play(sourceToken, targetToken, {...options, damageType, move});
    if (move) await move();
    await targetToken.object?.movementAnimationPromise;
}
async function finished({document: activity, macroClass: {identifier}, workflow}) {
    if (!workflow.token) return;
    const {direction, targets} = variants[identifier];
    const tokens = workflow[targets].tokens.filter(token => token.actor);
    if (!tokens.length) return;
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', identifier, configKeys);
    const maximum = (await rollUtils.rollDice(config.distance, {workflow}))?.total ?? 5;
    const animation = automationUtils.getResolvedAnimation(activity, 'animation', {source: 'chris-premades', identifier});
    const damageType = workflowUtils.getDamageTypes(workflow.damageRolls ?? []).first();
    const move = token => moveTarget(activity, config, workflow.token.document, token.document, direction, maximum, animation, damageType);
    if (config.choose) for (const token of tokens) await move(token);
    else await Promise.all(tokens.map(move));
}
function buildConfig(animationIdentifier) {
    return {
        distance: {
            default: '5',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.Distance.Hint'
        },
        choose: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PushOnFail.Choose.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.Choose.Hint'
        },
        stopAdjacent: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PushOnFail.StopAdjacent.Label',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.StopAdjacent.Hint'
        },
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.MaxSize.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        animation: {
            default: {
                source: animationIdentifier ? 'chris-premades' : 'none',
                identifier: animationIdentifier ?? 'none'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.Animation.Hint'
        }
    };
}
const base = {
    rules: 'all',
    version: '2.1.9',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: finished,
            priority: 50
        }
    ]
};
/**
 * Pushes targets away from the user or pulls them toward it once the roll finishes. There is one variant each for
 * pushing or pulling targets that failed the save, and for pushing or pulling targets that were hit. Each target slides
 * in a straight line as forced movement. Nothing happens when the activity is used without a token.
 */
export const pushOnFail = {...base, genericConfig: buildConfig()};
export const pullOnFail = {...base, genericConfig: buildConfig('castBeam')};
export const pullOnHit = {...base, genericConfig: buildConfig('castBeam')};
export const pushOnHit = {...base, genericConfig: buildConfig()};
const configKeys = Object.keys(pushOnFail.genericConfig);
