import {animationUtils, automationUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'advancedMeleeAttack', 'activityId');
    if (activityId != workflow.activity.id) return;
    if (!workflow.targets.size) return;
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'advancedMeleeAttack'});
    if (!animation) return;
    animationOptions.switchDistance = workflow.rangeDetails.range;
    await animation.macros.attack(workflow.token.document, workflow.targets.map(token => token.document), animationOptions);
}
/**
 * Plays a melee attack animation from the user to each target after the attack roll.
 * Bound on an item. Fires on `itemAttackRollComplete`.
 *
 * Config:
 * - `activityId`: only animate when this activity is used.
 * - `animation`: played from the user to the targets, using the attack's range as the switch distance.
 */
export const advancedMeleeAttack = {
    rules: 'all',
    version: '2.0.1',
    category: 'animations',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemAttackRollComplete',
            macro: use,
            priority: 10
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.Activity',
            hint: ''
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'advancedMeleeAttack'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetTokens', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};