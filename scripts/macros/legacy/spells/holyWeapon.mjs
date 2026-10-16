import {effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getHolder(item) {
    return canvas.scene?.tokens.find(token => token.actor?.items.some(weapon => weapon.effects.some(effect => effect.origin?.startsWith(item.uuid))));
}
async function use({workflow}) {
    if (workflow.activity.identifier !== 'holy-weapon-dismiss') return;
    const holder = getHolder(workflow.item) ?? workflow.token?.document;
    const burst = itemUtils.getActivityByIdentifier(workflow.item, 'holy-weapon-burst');
    await effectUtils.endConcentration(workflow.actor, workflow.item);
    if (!holder || !burst) return;
    const targets = tokenUtils.findNearby(holder, 30, {disposition: 'enemy'});
    if (targets.length) await workflowUtils.completeActivityUse(burst, targets, {consumeUsage: false, consumeResources: false, spellSlot: false});
}
export const holyWeapon = {
    name: 'Holy Weapon',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
