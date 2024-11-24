import {activityUtils, genericUtils} from '../utils.js';
/* 
Notes on Activities (WIP):
- activityIdentifiers flag on item contains object of the form { identifier: activityId }
- hiddenActivities flag on item contains an array of activity identifiers which shouldn't show up when USING the item, only when editing
*/
function flagAllRiders(item, updates) {
    let cprRiders = genericUtils.getProperty(item, 'flags.chris-premades.hiddenActivities') ?? [];
    cprRiders = cprRiders.map(i => activityUtils.getActivityByIdentifier(item, i)?.id).filter(i => i);
    // let currRiders = genericUtils.getProperty(item, 'flags.dnd5e.riders.activity') ?? [];
    let newRiders = genericUtils.getProperty(updates, 'flags.dnd5e.riders.activity') ?? [];
    let uniqueRiders = new Set([...newRiders, ...cprRiders]);
    genericUtils.setProperty(updates, 'flags.dnd5e.riders.activity', Array.from(uniqueRiders));
}
export let activities = {
    flagAllRiders
};