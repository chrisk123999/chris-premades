import {automationUtils, regionUtils, workflowUtils} from '../../proxy.mjs';
export function getDamageType(workflow) {
    const [rolled] = workflowUtils.getDamageTypes(workflow.damageRolls ?? []);
    return rolled ?? workflow.activity?.damage?.parts?.[0]?.types?.first();
}
export function getTargetResult(workflow, token) {
    return {
        hit: workflow.attackRoll ? workflow.hitTargets.has(token) : undefined,
        saved: workflow.activity?.save ? !workflow.failedSaves.has(token) : undefined,
        killed: !!workflow.damageList?.some(entry => (entry.actorUuid ?? entry.actor?.uuid) === token.actor?.uuid && entry.oldHP > 0 && entry.newHP <= 0)
    };
}
export function getTargetResults(workflow) {
    return Array.from(workflow.targets, token => ({token: token.document, ...getTargetResult(workflow, token)}));
}
export function playTargetAnimations(workflow, {animation, options}) {
    if (!workflow.token || !workflow.targets.size || !animation?.macros?.play) return;
    const damageType = getDamageType(workflow);
    for (const token of workflow.targets) {
        const self = token.document === workflow.token.document;
        if (self && workflow.activity?.type === 'utility') continue;
        animation.macros.play(self ? undefined : workflow.token.document, token.document, {...options, damageType, ...getTargetResult(workflow, token)});
    }
}
export function playAreaAnimation(workflow, {animation, options}, {region = workflow.template, radius = Number(workflow.activity?.target?.template?.size) || 0} = {}) {
    if (!workflow.token || !animation?.macros?.play) return;
    const targets = getTargetResults(workflow);
    return animation.macros.play(workflow.token.document, region, {...options, damageType: getDamageType(workflow), targets, radius});
}
function playArea(document, workflow) {
    const areaType = workflow.activity?.target?.template?.type;
    if (!areaType && automationUtils.getGenericConfigValue(document, 'chris-premades', 'spellAnimation', 'areaOnly')) return;
    if (!workflow.template && areaType && !areaType.endsWith('NoTemplate')) return;
    const placed = workflow.token ? regionUtils.getPlacedRegions(workflow.token.document.parent, workflow.item).at(-1) : undefined;
    const ownRegion = placed && regionUtils.getActivity(placed)?.uuid === workflow.activity?.uuid ? placed : undefined;
    if (!workflow.template && placed && !ownRegion) return;
    const region = workflow.template ?? ownRegion;
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(document, 'areaAnimation', {source: 'chris-premades', identifier: 'spellAnimation'}), {region});
}
function late({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'spellAnimation'}));
    playArea(document, workflow);
}
/**
 * Plays an animation at each target and an animation over the placed area once the roll finishes.
 * Bound on an item. Fires on `itemRollFinished`.
 *
 * Config:
 * - `animation`: played from the user to each target. Receives the damage type, each target's hit or save result, and whether the roll dropped it to 0 HP.
 * - `areaAnimation`: played over the placed region, or around the user when no region was placed. Receives the damage type and each target's hit or save result.
 * - `areaOnly`: only play the area animation for activities that have an area.
 */
export const spellAnimation = {
    rules: 'all',
    version: '2.1.5',
    category: 'animations',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    genericConfig: {
        animation: {
            default: {
                source: 'none',
                identifier: 'none'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.TargetAnimation',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.TargetAnimationHint'
        },
        areaAnimation: {
            default: {
                source: 'none',
                identifier: 'none'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaAnimation',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaAnimationHint'
        },
        areaOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaOnly',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaOnlyHint'
        }
    }
};
