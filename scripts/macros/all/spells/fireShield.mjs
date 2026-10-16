import {actorUtils, documentUtils} from '../../../proxy.mjs';
async function dismiss({workflow}) {
    if (workflow.activity.identifier !== 'fire-shield-dismiss') return;
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'fireShield');
    if (effect) await documentUtils.deleteDocument(effect);
}
export const fireShield = {
    name: 'Fire Shield',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: dismiss, priority: 50}
    ]
};
