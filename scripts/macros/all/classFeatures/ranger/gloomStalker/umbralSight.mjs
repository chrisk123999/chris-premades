import {tokenUtils} from '../../../../../proxy.mjs';
const passiveModes = ['lightPerception', 'basicSight', 'hearing'];
function activeModes(token) {
    return Object.entries(token.detectionModes).filter(([id, mode]) => mode.enabled && !passiveModes.includes(id)).map(([id]) => id);
}
async function attack({document: item, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.token) return;
    if (tokenUtils.getLightLevel(workflow.token.document) !== 'dark') return;
    const targetToken = workflow.targets.first().document;
    if (tokenUtils.canSense(targetToken, workflow.token.document, activeModes(targetToken))) return;
    workflow.tracker.advantage.add('umbral-sight', item.name);
}
async function attacked({document: item, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.token) return;
    const targetToken = workflow.targets.first().document;
    if (tokenUtils.getLightLevel(targetToken) !== 'dark') return;
    if (tokenUtils.canSense(workflow.token.document, targetToken, activeModes(workflow.token.document))) return;
    workflow.tracker.disadvantage.add('umbral-sight', item.name);
}
export const umbralSight = {
    name: 'Umbral Sight',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        },
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        }
    ]
};
