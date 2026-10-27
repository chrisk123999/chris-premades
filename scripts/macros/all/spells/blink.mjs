import {documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
function getItem(effect) {
    return effectUtils.getOriginActivitySync(effect)?.item;
}
async function vanish({document: effect, token}) {
    const item = getItem(effect);
    if (!item) return;
    const modern = documentUtils.getRules(item) === '2024';
    const {roll} = await rollUtils.rollDice(modern ? '1d6' : '1d20', {message: true, flavor: item.name, speaker: ChatMessage.implementation.getSpeaker({token})});
    if (roll.total < (modern ? 4 : 11)) return;
    const effectData = documentUtils.getEffectData(item, 'blinkAwayEffect1');
    genericUtils.setProperty(effectData, 'flags.chris-premades.blinkItem', item.uuid);
    await effectUtils.createEffects(effect.parent, [effectData], {parentEntity: effect});
}
async function reappear({document: effect}) {
    const item = fromUuidSync(effect.flags['chris-premades']?.blinkItem ?? '', {strict: false});
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'blink-return') : undefined;
    if (activity) await workflowUtils.completeActivityUse(activity, [], {consumeUsage: false, consumeResources: false, spellSlot: false});
    await documentUtils.deleteDocument(effect);
}
export const blink = {
    name: 'Blink',
    version: '2.1.4',
    rules: 'all',
    combat: [
        {pass: 'actorTurnEnd', macro: vanish, priority: 50}
    ]
};
export const blinkAway = {
    name: 'Blink: Blinked Away',
    version: blink.version,
    rules: blink.rules,
    combat: [
        {pass: 'actorTurnStart', macro: reappear, priority: 50}
    ]
};
