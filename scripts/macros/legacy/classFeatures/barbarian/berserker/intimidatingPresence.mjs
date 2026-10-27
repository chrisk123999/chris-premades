import {actorUtils, automationUtils, dataUtils, dialogUtils, documentUtils, effectUtils, itemUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
async function create({effect, macroClass: {identifier, source}}) {
    const activity = await effectUtils.getOriginActivity(effect);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Intimidating Presence failed to find origin activity! (effect) ${effect.uuid}`);
    const extend = itemUtils.getActivityByIdentifier(activity.item, 'itmp-extend');
    if (!extend) return Logging.addMacroWarning(source, identifier, `Intimidating Presence failed to find extend activity! (item) ${activity.item.uuid} (identifier) itmp-extend`);
    await documentUtils.update(extend, {[`flags.${source}.previousITMP`]: effect.uuid});
}
async function turn({document: effect, macroClass: {identifier, source}, token}) {
    const activity = await effectUtils.getOriginActivity(effect);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Intimidating Presence failed to find origin activity! (effect) ${effect.uuid}`);
    const sourceToken = actorUtils.getFirstToken(activity.actor);
    if (!sourceToken) return Logging.addMacroWarning(source, identifier, `Intimidating Presence failed to find origin token! (effect) ${effect.uuid} (actor) ${activity.actor.uuid}`);
    if (tokenUtils.getDistance(token, sourceToken) > automationUtils.getConfigValue(activity.item, 'range'))
        return await endEffect(effect, sourceToken, token, 'Range');
    if (!tokenUtils.canSee(token, sourceToken))
        return await endEffect(effect, sourceToken, token, 'Sight');
}
async function endEffect(effect, sourceToken, targetToken, reason) {
    const source = dialogUtils.getTokenName(sourceToken);
    const target = dialogUtils.getTokenName(targetToken);
    await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({token: sourceToken, alias: source}),
        content: _loc('CHRISPREMADES.Macros.Legacy.IntimidatingPresence.' + reason, {effect: effect.name, target})
    });
    await documentUtils.deleteDocument(effect);
}
async function extend({document: activity, macroClass: {identifier, source}}) {
    const effect = await fromUuid(activity.flags[source]?.previousITMP);
    if (!effect) return Logging.addMacroWarning(source, identifier, `Intimidating Presence: Extend Duration failed to find the target effect! (activity) ${activity.uuid} (effect) ${activity.flags[source]?.previousITMP}`);
    await effectUtils.resetDuration(effect);
}
async function immune({document: activity, workflow}) {
    if (!workflow.saves.size) return;
    const data = {
        name: `${activity.item.name}: ${_loc('CHRISPREMADES.Macros.Legacy.IntimidatingPresence.Immune')}`,
        duration: {value: automationUtils.getConfigValue(activity.item, 'duration'), units: 'seconds'},
        system: {changes: [{key: 'flags.cat.FI.' + activity.identifier, type: 'override', value: true}]},
        img: activity.item.img
    };
    dataUtils.setOrigin(data, activity);
    await Promise.all(workflow.saves.map(t => {
        if (t.actor.flags.cat?.FI?.[activity.identifier]) return;
        return effectUtils.createEffects(t.actor, [data]);
    }));
}
export const intimidatingPresence = {
    name: 'Intimidating Presence',
    version: '2.1.4',
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turn,
            priority: 200
        }
    ],
    effect: [
        {
            pass: 'created',
            macro: create,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 60,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Legacy.IntimidatingPresence.RangeLimit'
        },
        duration: {
            default: 86400,
            type: 'number',
            category: 'behavior',
            label: 'DND5E.Duration',
            hint: 'CHRISPREMADES.Macros.Legacy.IntimidatingPresence.ImmunityDuration'
        }
    }
};
export const extendIntimidatingPresence = {
    version: intimidatingPresence.version,
    rules: intimidatingPresence.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: extend,
            priority: 50
        }
    ]
};
export const immuneIntimidatingPresence = {
    version: intimidatingPresence.version,
    rules: intimidatingPresence.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: immune,
            priority: 50
        }
    ]
};
