import {activityUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function rest({trigger: {entity: item}, actor}) {
    let tokensOfTheDeparted = itemUtils.getItemByIdentifier(actor, 'tokensOfTheDeparted');
    let uses = tokensOfTheDeparted?.system.uses;
    if (!uses || uses.value > 0) return;
    let recovery = activityUtils.getActivityByIdentifier(item, 'recoverToken', {strict: true});
    if (!recovery) return;
    await workflowUtils.syntheticActivityRoll(recovery, [], {consumeUsage: true, consumeResources: true}); 
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['recoverToken'], 'tokensOfTheDeparted');
}
export let deathsFriend = {
    name: 'Death\'s Friend',
    version: '1.5.15',
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ]
};
