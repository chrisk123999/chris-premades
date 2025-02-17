import {activityUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!workflow.token || !workflow.targets.size || !activityUtils.hasSave(workflow.activity)) return;
    if (!workflow.activity.save.ability.has('dex')) return;
    let sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration.seconds = 1;
    let used = false;
    await Promise.all(workflow.targets.map(async token => {
        if (itemUtils.getItemByIdentifier(token.actor, 'leadingEvasion')) return;
        let valid = tokenUtils.findNearby(token, 5, 'ally').find(i => itemUtils.getItemByIdentifier(i.actor, 'leadingEvasion') && !i.actor.statuses.has('incapacitated') && workflow.targets.has(i));
        if (!valid) return;
        await effectUtils.createEffect(token.actor, effectData, {identifier: 'leadingEvasionEffect', animate: false});
        used = true;
    }));
    if (used) await item.displayCard();
}
async function late({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size || !activityUtils.hasSave(workflow.activity)) return;
    if (!workflow.activity.save.ability.has('dex')) return;
    await Promise.all(workflow.targets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'leadingEvasionEffect');
        if (effect) await genericUtils.remove(effect);
    }));
}
export let leadingEvasion = {
    name: 'Leading Evasion',
    version: '1.1.38',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'sceneRollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};