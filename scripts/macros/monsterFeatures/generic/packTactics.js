import {genericUtils, tokenUtils} from '../../../utils.js';

async function early({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), 5, 'enemy').filter(i => i.document.uuid !== workflow.token.document.uuid);
    if (!nearbyTargets.length) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
}
export let packTactics = {
    name: 'Pack Tactics',
    translation: 'CHRISPREMADES.Macros.PackTactics.Name',
    version: '0.12.83',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};