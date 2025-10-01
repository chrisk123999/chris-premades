import {activityUtils, itemUtils, spellUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['wildCompanion'], 'wildShape');
    let activity = activityUtils.getActivityByIdentifier(item, 'wildCompanion', {strict: true});
    if (!activity) return;
    let findFamiliar = await spellUtils.getCompendiumSpell('findFamiliar', {identifier: true, rules: 'modern'});
    if (!findFamiliar) return;
    await activityUtils.correctSpellLink(activity, findFamiliar);
}
export let wildCompanion = {
    name: 'Wild Companion',
    version: '1.3.83',
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