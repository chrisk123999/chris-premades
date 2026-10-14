import {automationUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function explode({document, workflow, castData}) {
    if (workflow.activity.identifier === 'explosion') return;
    const target = workflow.targets.first();
    if (!target) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'explosion');
    if (!activity) return Logging.addMacroWarning('CPR', 'ice-knife', 'Explosion activity missing from item.', {notify: 'warn'});
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (workflow.token && animation?.macros?.play) {
        await animation.macros.play(workflow.token.document, target.document, {
            ...options,
            damageType: activity.damage.parts[0]?.types.first(),
            hit: workflow.hitTargets.has(target)
        });
    }
    const targets = tokenUtils.findNearby(target.document, automationUtils.getConfigValue(document, 'explosionRadius'), {includeToken: true});
    await workflowUtils.syntheticActivityRoll(activity, targets, {spellSlot: false, atLevel: castData.castLevel});
}
export const iceKnife = {
    name: 'Ice Knife',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: explode,
            priority: 50
        }
    ],
    config: {
        explosionRadius: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'iceKnife'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
