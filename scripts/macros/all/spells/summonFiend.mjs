import {actorUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function deathThroes({summon}) {
    const item = actorUtils.getItemByIdentifier(summon.actor, 'summon-fiend-death-throes');
    const token = summon.token;
    if (!item || !token) return;
    const targets = tokenUtils.findNearby(token, 10, {includeIncapacitated: true});
    if (targets.length) await workflowUtils.syntheticItemRoll(item, targets);
}
export const summonFiend = {
    name: 'Summon Fiend',
    version: '2.1.3',
    rules: 'all',
    summon: [
        {pass: 'preDelete', macro: deathThroes, priority: 50}
    ]
};
