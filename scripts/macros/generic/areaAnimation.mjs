import {automationUtils} from '../../proxy.mjs';
import {getDamageType, getTargetResults} from './spellAnimation.mjs';
export function playAreaAnimation(workflow, {animation, options}, {region = workflow.template, radius = Number(workflow.activity?.target?.template?.size) || 0} = {}) {
    if (!workflow.token || !animation?.macros?.play) return;
    const targets = getTargetResults(workflow);
    return animation.macros.play(workflow.token.document, region, {...options, damageType: getDamageType(workflow), targets, radius});
}
function late({document, workflow}) {
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'areaAnimation'}));
}
/**
 * Plays an animation over the area the item placed once the roll finishes.
 * Bound on an item. Fires on `itemRollFinished`.
 *
 * Config:
 * - `animation`: played over the placed region, or around the user when no region was placed. Receives the damage type and each target's hit or save result.
 */
export const areaAnimation = {
    rules: 'all',
    version: '2.0.0',
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
                source: 'chris-premades',
                identifier: 'castArea'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};
