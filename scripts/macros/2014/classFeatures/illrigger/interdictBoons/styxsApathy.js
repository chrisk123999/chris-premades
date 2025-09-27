import {actorUtils, itemUtils} from '../../../../../utils.js';
async function turnStart({trigger: {entity: effect}}) {
    await actorUtils.setReactionUsed(effect.parent);
}
async function turnEnd({trigger: {entity: effect}}) {
    await actorUtils.removeReactionUsed(effect.parent);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonStyxsApathy = {
    name: 'Interdict Boons: Styx\'s Apathy',
    version: '1.3.76',
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
export let interdictBoonStyxsApathyEffect = {
    name: 'Interdict Boons: Styx\'s Apathy: Effect',
    version: interdictBoonStyxsApathy.version,
    rules: interdictBoonStyxsApathy.rules,
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