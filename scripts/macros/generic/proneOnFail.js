import {actorUtils, effectUtils} from '../../utils.js';
async function late({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        if (!actorUtils.checkTrait(token.actor, 'ci', 'prone') && !effectUtils.getEffectByStatusID(token.actor, 'prone')) await effectUtils.applyConditions(token.actor, ['prone']);
    }));
}
export let proneOnFail = {
    name: 'Prone On Fail',
    version: '0.12.74',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};