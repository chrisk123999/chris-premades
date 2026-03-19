import {activityUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function preUse({trigger: {entity: item}}) {
    if (item.system.uses.value) return;
    let tokensOfTheDeparted = itemUtils.getItemByIdentifier(item.parent, 'tokensOfTheDeparted');
    if (!tokensOfTheDeparted) return;
    if (!tokensOfTheDeparted.system.uses.value) return;
    let tokenActivity = activityUtils.getActivityByIdentifier(tokensOfTheDeparted, 'useWail', {strict: true});
    if (!tokenActivity) return;
    if (!await dialogUtils.confirm(
        item.name, 
        genericUtils.format('CHRISPREMADES.Macros.TokensOfTheDeparted.MustSpend', {name: tokensOfTheDeparted.name, feature: item.name}),
        {buttons: 'okCancel'}
    )) return false;
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent - 1});
    await workflowUtils.syntheticActivityRoll(tokenActivity, [], {consumeUsage: true, consumeResources: true});
    //await genericUtils.sleep(100);
}
export let ghostWalk = {
    name: 'Ghost Walk',
    version: '1.5.15',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: preUse,
                priority: 50
            }
        ]
    }
};
