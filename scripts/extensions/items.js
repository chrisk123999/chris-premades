import {activityUtils, genericUtils, spellUtils} from '../utils.js';
async function fixCastActivities(item) {
    let castActivities = item.flags['chris-premades']?.castActivities;
    if (!castActivities?.length) return;
    for (let data of castActivities) {
        let {identifier, name, activityId} = data;
        let activity = item.system.activities.get(activityId);
        if (!activity) continue;
        let spell = await spellUtils.getCompendiumSpell(name, {rules: genericUtils.getRules(item), ignoreNotFound: true});
        if (!spell && identifier) spell = await spellUtils.getCompendiumSpell(name, {rules: genericUtils.getRules(item), ignoreNotFound: true, identifier});
        if (!spell) return;
        await activityUtils.correctSpellLink(activity, spell);
    }
}
export let items = {
    fixCastActivities
};