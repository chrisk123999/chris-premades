import {activityUtils, actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: effect}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let nearbyInvokeDuplicity = tokenUtils.findNearby(workflow.targets.first(), 5, 'enemy').find(token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'summonedEffect');
        if (!effect) return;
        if (effect.flags['chris-premades']?.macros?.midi?.actor?.find(i => i === 'improvedDuplicityEffect')) return true;
    });
    if (!nearbyInvokeDuplicity) return;
    workflow.advantage = true;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let feature = itemUtils.getItemByIdentifier(origin.actor, 'improvedDuplicity');
    if (!feature) return;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + feature.name);
}
async function removed({trigger: {entity: effect}}) {
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let feature = itemUtils.getItemByIdentifier(origin.actor, 'improvedDuplicity');
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'heal', {strict: true});
    if (!activity) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    let nearbyTokens = tokenUtils.findNearby(token, 5, 'ally', {includeIncapacitated: true});
    let ownerToken = actorUtils.getFirstToken(origin.actor);
    if (ownerToken && !nearbyTokens.includes(ownerToken)) nearbyTokens.push(ownerToken);
    if (!nearbyTokens.length) return;
    let selection;
    if (nearbyTokens.length > 1) {
        selection = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.ImprovedDuplicity.ChooseHeal', nearbyTokens, {skipDeadAndUnconscious: false});
        if (!selection) return;
    } else {
        selection = [ownerToken];
    }
    await workflowUtils.syntheticActivityRoll(activity, [selection[0]]);
}
export let improvedDuplicity = {
    name: 'Improved Duplicity',
    version: '1.3.20',
    rules: 'modern'
};
export let improvedDuplicityEffect = {
    name: 'Improved Duplicity: Effect',
    version: improvedDuplicity.version,
    rules: improvedDuplicity.rules,
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 25
        }
    ]
};