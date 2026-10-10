import {activityUtils, actorUtils, automationUtils, constants, workflowUtils} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
function preambleComplete({document, workflow}) {
    if (!workflow.targets.some(target => actorUtils.isWounded(target.actor))) return;
    const part = workflow.activity.damage.parts[0];
    if (!part) return;
    const denomination = Number(automationUtils.getConfigValue(document, 'dieSize').slice(1));
    if (part.denomination === denomination) return;
    const activityData = activityUtils.getDamageModifiedActivityData(workflow.activity, {number: part.number, denomination, bonus: part.bonus});
    workflowUtils.setActivity(workflow, activityData);
}
function late({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
}
export const tollTheDead = {
    name: 'Toll the Dead',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: preambleComplete,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        dieSize: {
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd12',
            get options() {
                return constants.diceSizeOptions;
            },
            homebrew: true,
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'tollTheDead'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
