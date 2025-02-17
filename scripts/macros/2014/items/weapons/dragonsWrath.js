import {activityUtils, compendiumUtils, constants, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.d20AttackRoll !== 20) return;
    let targetToken = workflow.hitTargets.first();
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dragonsWrathCritical', {strict: true});
    if (!feature) return;
    let nearbyTargets = await tokenUtils.findNearby(targetToken, 5, 'ally');
    if (!nearbyTargets.length) return;
    await workflowUtils.syntheticActivityRoll(feature, nearbyTargets);
}
export let dragonsWrath = {
    name: 'Dragon\'s Wrath',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['dragonsWrath']
            }
        ]
    }
};
export let dragonsWrath0 = {
    name: 'Dragon\'s Wrath Weapon (Slumbering)',
    version: '1.1.10'
};
export let dragonsWrath1 = {
    name: 'Dragon\'s Wrath Weapon (Stirring)',
    version: '1.1.10'
};
export let dragonsWrath2 = {
    name: 'Dragon\'s Wrath Weapon (Wakened)',
    version: '1.1.10'
};
export let dragonsWrath3 = {
    name: 'Dragon\'s Wrath Weapon (Ascendant)',
    version: '1.1.10'
};