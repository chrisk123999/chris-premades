import {actorUtils, automationUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/spellAnimation.mjs';
async function late({document, workflow}) {
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
    await Promise.all(Array.from(workflow.failedSaves, token => actorUtils.setReactionUsed(token.actor)));
}
export const armsOfHadar = {
    name: 'Arms of Hadar',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'armsOfHadar'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
