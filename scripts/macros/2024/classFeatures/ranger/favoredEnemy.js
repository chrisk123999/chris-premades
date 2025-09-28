import {activityUtils, itemUtils, spellUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
    let huntersMark = await spellUtils.getCompendiumSpell('huntersMark', {identifier: true, rules: 'modern'});
    if (!huntersMark) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'huntersMark', {strict: true});
    if (!activity) return;
    await activityUtils.correctSpellLink(activity, huntersMark);
}
export let favoredEnemy = {
    name: 'Favored Enemy',
    version: '1.3.78',
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