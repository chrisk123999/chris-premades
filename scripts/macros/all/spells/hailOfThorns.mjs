import {automationUtils} from '../../../proxy.mjs';
import {getTargetResults} from '../../generic/spellAnimation.mjs';
function late({workflow}) {
    const {animation, options} = automationUtils.getResolvedAnimation(workflow.item, 'animation');
    const targetToken = workflow.targets.first();
    if (!workflow.token || !targetToken || !animation?.macros?.play) return;
    const targets = getTargetResults(workflow);
    animation.macros.play(workflow.token.document, targetToken.document, {...options, targets});
}
export const hailOfThorns = {
    name: 'Hail of Thorns',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'hailOfThorns'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
