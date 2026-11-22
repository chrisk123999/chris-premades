import {activityUtils, automationUtils, regionUtils, workflowUtils} from '../../proxy.mjs';
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
    return workflow.targets.tokens.map(token => ({token: token.document, ...getTargetResult(workflow, token)}));
}
export function playTargetAnimations(workflow, {animation, options}, {includeSelf} = {}) {
    if (!workflow.token || !workflow.targets.count || !animation?.macros?.play) return;
    const damageType = getDamageType(workflow);
    return Promise.all(workflow.targets.tokens.map(token => {
        const self = token.document === workflow.token.document;
        if (self && workflow.activity?.type === 'utility' && !includeSelf) return;
        return animation.macros.play(self ? undefined : workflow.token.document, token.document, {...options, damageType, ...getTargetResult(workflow, token)});
    }));
}
export function playAreaAnimation(workflow, {animation, options}, {region = workflow.template, radius = (workflow.activity && activityUtils.getTemplateSize(workflow.activity)) || 0} = {}) {
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
    const includeSelf = automationUtils.getGenericConfigValue(document, 'chris-premades', 'spellAnimation', 'includeSelf');
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'spellAnimation'}), {includeSelf});
    playArea(document, workflow);
}
/**
 * Plays an animation at each target and an animation over the placed area once the item's roll finishes. Both
 * animations receive the damage type and each target's hit, save and 0 HP result.
 */
export const spellAnimation = {
    rules: 'all',
    version: '2.1.10',
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
            category: 'animations',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.TargetAnimation.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.TargetAnimation.Hint'
        },
        includeSelf: {
            default: false,
            type: 'checkbox',
            category: 'animations',
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.IncludeSelf.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.IncludeSelf.Hint'
        },
        areaAnimation: {
            default: {
                source: 'none',
                identifier: 'none'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaAnimation.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaAnimation.Hint'
        },
        areaOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpellAnimation.AreaOnly.Hint'
        }
    }
};
