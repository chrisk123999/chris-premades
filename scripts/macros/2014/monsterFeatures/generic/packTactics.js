import {tokenUtils} from '../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), 5, 'enemy').filter(i => i.document.uuid !== workflow.token.document.uuid);
    if (!nearbyTargets.length) return;
    workflow.tracker.advantage.add(item.name, item.name);
}
export let packTactics = {
    name: 'Pack Tactics',
    translation: 'CHRISPREMADES.Macros.PackTactics.Name',
    version: '0.12.83',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};