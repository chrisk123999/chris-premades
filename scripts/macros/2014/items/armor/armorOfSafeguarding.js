import {activityUtils, spellUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'beaconOfHope', {strict: true});
    if (!activity) return;
    let beaconOfHope = await spellUtils.getCompendiumSpell('beaconOfHope', {identifier: true, rules: 'legacy'});
    if (!beaconOfHope) return;
    await activityUtils.correctSpellLink(activity, beaconOfHope);
}
export let armorOfSafeguardingP = {
    name: 'Armor of Safeguarding, Plate',
    version: '1.3.94',
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
export let armorOfSafeguardingC = {
    name: 'Armor of Safeguarding, Chain Mail',
    version: armorOfSafeguardingP.version,
    item: armorOfSafeguardingP.item
};
export let armorOfSafeguardingR = {
    name: 'Armor of Safeguarding, Ring Mail',
    version: armorOfSafeguardingP.version,
    item: armorOfSafeguardingP.item
};
export let armorOfSafeguardingS = {
    name: 'Armor of Safeguarding, Splint',
    version: armorOfSafeguardingP.version,
    item: armorOfSafeguardingP.item
};