import {activityUtils, genericUtils, spellUtils} from '../utils.js';
async function fixCastActivities(item) {
    let castActivities = item.flags['chris-premades']?.castActivities;
    console.log(castActivities);
    if (!castActivities?.length) return;
    for (let data of castActivities) {
        console.log(data);
        let {identifier, name, activityId} = data;
        let activity = item.system.activities.get(activityId);
        if (!activity) continue;
        console.log(activity);
        let spell = await spellUtils.getCompendiumSpell(name, {rules: genericUtils.getRules(item), ignoreNotFound: true});
        console.log(spell);
        if (!spell && identifier) spell = await spellUtils.getCompendiumSpell(name, {rules: genericUtils.getRules(item), ignoreNotFound: true, identifier});
        if (!spell) return;
        await activityUtils.correctSpellLink(activity, spell);
    }
}
export let items = {
    fixCastActivities
};