import {summonUtils} from '../../../../../proxy.mjs';
async function died({document: item, effect}) {
    if (!effect.statuses.has('dead')) return;
    await Promise.all(summonUtils.getSummonsBySource(item).map(summon => summonUtils.deleteSummon(summon)));
}
export const summonWildfireSpirit = {
    name: 'Summon Wildfire Spirit',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {
            pass: 'actorCreated',
            macro: died,
            priority: 50
        }
    ]
};
