import {itemUtils, tokenUtils} from '../../../../../utils.js';
async function pull({trigger, workflow}) {
    if (!workflow.failedSaves.size || !workflow.token) return;
    let distance = Math.min(tokenUtils.getDistance(workflow.token, workflow.failedSaves.first()) -5, 10);
    await tokenUtils.pushToken(workflow.token, workflow.failedSaves.first(), -distance);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['pull', 'grapple'], 'balefulInterdict');
}
export let interdictBoonAcheronsChain = {
    name: 'Interdict Boons: Acheron\'s Chain',
    version: '1.3.71',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: pull,
                priority: 50,
                activities: ['pull']
            }
        ]
    },
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