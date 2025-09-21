import {actorUtils, itemUtils} from '../../../../../utils.js';
async function turnStart({trigger: {entity: effect}}) {
    await actorUtils.setReactionUsed(effect.parent);
}
async function turnEnd({trigger: {entity: effect}}) {
    await actorUtils.removeReactionUsed(effect.parent);
}
async function added({trigger: {entity: item}}) {
    await await itemUtils.correctActivityItemConsumption(item, ['use'], 'balefulInterdict');
}
export let interdictStyxsApathy = {
    name: 'Interdict Boons: Styx\'s Apathy',
    version: '1.3.66',
    rules: 'legacy',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};
export let interdictStyxsApathyEffect = {
    name: 'Interdict Boons: Styx\'s Apathy: Effect',
    version: interdictStyxsApathy.version,
    rules: interdictStyxsApathy.rules,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        },
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};