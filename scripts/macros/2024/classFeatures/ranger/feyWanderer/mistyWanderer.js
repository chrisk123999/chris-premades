import {activityUtils, spellUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let mistyStep = await spellUtils.getCompendiumSpell('mistyStep', {identifier: true, rules: 'modern'});
    if (!mistyStep) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'mistyStep', {strict: true});
    if (!activity) return;
    await activityUtils.correctSpellLink(activity, mistyStep);
}
export let mistyWanderer  = {
    name: 'Misty Wanderer',
    version: '1.3.99',
    rules: 'modern',
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