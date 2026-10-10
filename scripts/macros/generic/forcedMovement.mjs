import {actorUtils, automationUtils, constants, dialogUtils, genericUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
const variants = {
    pullOnFail: {direction: -1, targets: 'failedSaves'},
    pullOnHit: {direction: -1, targets: 'hitTargets'},
    pushOnFail: {direction: 1, targets: 'failedSaves'}
};
async function getDistance(activity, config, sourceToken, targetToken, direction, maximum) {
    if (config.maxSize && actorUtils.getSize(targetToken.actor) > CONFIG.DND5E.actorSizes[config.maxSize]?.numerical) return 0;
    let limit = maximum;
    if (direction < 0 && config.stopAdjacent) limit = Math.min(limit, Math.floor((tokenUtils.getDistance(sourceToken, targetToken) - 4) / 5) * 5);
    if (limit <= 0) return 0;
    if (!config.choose) return limit;
    const scene = sourceToken.parent;
    const steps = Array.from({length: Math.floor(limit / 5)}, (_, index) => (index + 1) * 5);
    if (!steps.length) return 0;
    const buttons = [[_loc('CHRISPREMADES.Config.None'), 0], ...steps.map(distance => [dnd5e.utils.formatLength(genericUtils.convertDistance(scene, distance), scene.grid.units), distance])];
    return Number(await dialogUtils.buttonDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Generic.PushOnFail.Prompt', {target: targetToken.name}), buttons));
}
async function moveTarget(activity, config, sourceToken, targetToken, direction, maximum, {animation, options}, damageType) {
    const distance = await getDistance(activity, config, sourceToken, targetToken, direction, maximum);
    const move = distance ? () => tokenUtils.slideToken(targetToken, {sourceToken, distance: direction * genericUtils.convertDistance(sourceToken.parent, distance)}) : undefined;
    if (animation?.macros?.play) await animation.macros.play(sourceToken, targetToken, {...options, damageType, move});
    else if (move) await move();
    await targetToken.object?.movementAnimationPromise;
}
async function finished({document: activity, macroClass: {identifier}, workflow}) {
    if (!workflow.token) return;
    const {direction, targets} = variants[identifier];
    const tokens = Array.from(workflow[targets]).filter(token => token.actor);
    if (!tokens.length) return;
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', identifier, configKeys);
    const maximum = (await rollUtils.rollDice(config.distance, {document: activity}))?.total ?? 5;
    const animation = automationUtils.getResolvedAnimation(activity, 'animation', {source: 'chris-premades', identifier});
    const damageType = workflowUtils.getDamageTypes(workflow.damageRolls ?? []).first();
    const move = token => moveTarget(activity, config, workflow.token.document, token.document, direction, maximum, animation, damageType);
    if (!config.choose) return await Promise.all(tokens.map(move));
    for (const token of tokens) await move(token);
}
function buildConfig(animationIdentifier) {
    return {
        distance: {
            default: '5',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.DistanceHint'
        },
        choose: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PushOnFail.Choose',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.ChooseHint'
        },
        stopAdjacent: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.PushOnFail.StopAdjacent',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.StopAdjacentHint'
        },
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.MaxSizeHint',
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
            hint: 'CHRISPREMADES.Macros.Generic.PushOnFail.AnimationHint'
        }
    };
}
const base = {
    rules: 'all',
    version: '2.1.0',
    category: 'utility',
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
export const pushOnFail = {...base, genericConfig: buildConfig()};
export const pullOnFail = {...base, genericConfig: buildConfig('castBeam')};
export const pullOnHit = {...base, genericConfig: buildConfig('castBeam')};
const configKeys = Object.keys(pushOnFail.genericConfig);
