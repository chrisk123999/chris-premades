import {rollUtils, tokenUtils} from '../../../../../utils.js';
async function save({trigger: {token, roll}}) {
    if (!token) return;
    let nearbyTargets = tokenUtils.findNearby(token, 5, 'enemy', {includeIncapacitated: true});
    if (!nearbyTargets.length) return;
    return await rollUtils.addToRoll(roll, String(Math.min(nearbyTargets.length, 5)));
}
export let combatMasteryInexorable = {
    name: 'Combat Mastery: Inexorable',
    version: '1.3.66',
    rules: 'legacy',
    save: [
        {
            pass: 'bonus',
            macro: save,
            priority: 45
        }
    ]
};