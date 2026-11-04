import {actorUtils, genericUtils, tokenUtils} from '../../../proxy.mjs';
async function push({workflow}) {
    const source = workflow.token?.document;
    if (!source) return;
    const sourceSize = actorUtils.getSize(workflow.actor);
    for (const target of workflow.targets) {
        if (!target.actor) continue;
        const saved = !workflow.failedSaves.has(target) || actorUtils.getSize(target.actor) - 2 >= sourceSize;
        const distance = genericUtils.convertDistance(source.parent, 10);
        if (saved) await tokenUtils.slideToken(source, {sourceToken: target.document, distance});
        else await tokenUtils.slideToken(target.document, {sourceToken: source, distance});
    }
}
export const forceGauntlet = {
    name: 'Force Gauntlet',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: push,
            priority: 50
        }
    ]
};
