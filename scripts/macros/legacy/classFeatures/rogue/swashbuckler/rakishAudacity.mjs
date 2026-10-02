import {tokenUtils} from '../../../../../proxy.mjs';
async function doSneak({data: {workflow}}) {
    if ((workflow.disadvantage && !workflow.advantage) || !workflow.token) return;
    const targetToken = workflow.targets.first()?.document;
    if (!targetToken) return;
    if (tokenUtils.getDistance(workflow.token.document, targetToken) > 5) return;
    const nearby = tokenUtils.findNearby(workflow.token.document, 5).filter(token => token.id !== targetToken.id);
    if (!nearby.length) return true;
}
export const rakishAudacity = {
    name: 'Rakish Audacity',
    version: '2.0.0',
    rules: '2014',
    called: [
        {
            pass: 'actorSneakAttackDoSneak',
            macro: doSneak,
            priority: 50
        }
    ]
};
