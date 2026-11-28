import {actorUtils} from '../../../../proxy.mjs';
async function rested({document: item}) {
    const levels = item.actor.system.attributes.exhaustion ?? 0;
    if (levels) await actorUtils.addExhaustion(item.actor, -levels);
}
export const peakPhysicalCondition = {
    name: 'Peak Physical Condition',
    version: '2.1.11',
    rules: '2024',
    rest: [
        {
            pass: 'actorLong',
            macro: rested,
            priority: 50
        }
    ]
};
