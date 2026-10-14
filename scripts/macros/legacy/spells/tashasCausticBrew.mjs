import {automationUtils, documentUtils, effectUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/areaAnimation.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'tashasCausticBrew') return;
    const region = workflow.template;
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(document, 'animation'));
    const concentrationEffect = !workflow.failedSaves.size && effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
    else if (region) await documentUtils.deleteDocument(region);
}
export const tashasCausticBrew = {
    name: 'Tasha\'s Caustic Brew',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'tashasCausticBrew'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
