import {animationUtils, automationUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'advancedMeleeAttack', 'activityId');
    if (activityId != workflow.activity.id) return;
    if (!workflow.targets.size) return;
    const animationSetting = automationUtils.getGenericConfigValue(document, 'chris-premades', 'advancedMeleeAttack', 'animation');
    const animation = animationUtils.getAnimation(animationSetting);
    if (!animation) return;
    const animationOptions = {};
    if (animation.config) Object.keys(animation.config).forEach((key) => animationOptions[key] = automationUtils.getGenericAnimationConfig(document, 'chris-premades', 'advancedMeleeAttack', 'animation', key));
    animationOptions.switchDistance = workflow.rangeDetails.range;
    await animation.macros.attack(workflow.token.document, workflow.targets.map(token => token.document), animationOptions);
}
export const advancedMeleeAttack = {
    rules: 'all',
    version: '2.0.1',
    category: 'animations',
    generic: true,
    documents: ['Item'],
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