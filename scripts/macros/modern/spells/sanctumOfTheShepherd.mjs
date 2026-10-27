import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, Logging, rollUtils} from '../../../proxy.mjs';

const resolvedRegions = new Set();

function getRegionUuid(effect) {
    return effect.flags['chris-premades']?.sanctumOfTheShepherd?.region;
}
function getMarkerData(activity, effectId, regionUuid, parentEntity) {
    const effectData = documentUtils.getEffectData(activity, effectId, {parentEntity, activityUuid: activity.uuid});
    genericUtils.setProperty(effectData, 'flags.chris-premades.sanctumOfTheShepherd.region', regionUuid);
    return effectData;
}
async function use({document: item, workflow}) {
    if (workflow.activity.identifier !== 'sanctum-of-the-shepherd') return;
    const region = workflow.template;
    if (!region) return;
    const markerEffect = documentUtils.getEffectByIdentifier(item, 'sanctumOfTheShepherd');
    if (!markerEffect) return Logging.addMacroWarning('CPR', 'sanctum-of-the-shepherd', 'CHRISPREMADES.Macros.Modern.SanctumOfTheShepherd.MissingEffect', {notify: 'warn'});
    const candidates = Array.from(workflow.targets).filter(token => token.actor && token !== workflow.token).map(token => token.document);
    let chosen = [];
    if (candidates.length) {
        const max = Math.max(1, rollUtils.rollDiceSync(String(automationUtils.getConfigValue(item, 'creatures')), {document: workflow.activity}).total);
        const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Modern.SanctumOfTheShepherd.Select', {max}), candidates, {type: 'multiple', maxAmount: max, skipDeadAndUnconscious: false});
        chosen = selection?.result ?? [];
    }
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [getMarkerData(workflow.activity, markerEffect.id, region.uuid)]) ?? [];
    if (!casterEffect) return;
    await documentUtils.makeDependent(casterEffect, [region]);
    if (!chosen.length) return;
    const effectData = getMarkerData(workflow.activity, markerEffect.id, region.uuid, casterEffect);
    await Promise.all(chosen.map(token => effectUtils.createEffects(token.actor, [effectData])));
}
async function longRest({document: effect, token}) {
    const regionUuid = getRegionUuid(effect);
    const region = fromUuidSync(regionUuid, {strict: false});
    if (!region || !token?.regions?.has(region)) return;
    const activity = effectUtils.getOriginActivitySync(effect);
    const wardEffect = activity ? documentUtils.getEffectByIdentifier(activity.item, 'sanctumOfTheShepherdWard') : undefined;
    if (!wardEffect) return Logging.addMacroWarning('CPR', 'sanctum-of-the-shepherd', 'CHRISPREMADES.Macros.Modern.SanctumOfTheShepherd.MissingEffect', {notify: 'warn'});
    if (resolvedRegions.has(regionUuid)) return;
    resolvedRegions.add(regionUuid);
    const remaining = Math.floor(effect.duration.secondsRemaining ?? 0);
    const sourceEffect = fromUuidSync(effect.flags.dnd5e?.dependentOn, {strict: false}) ?? effect;
    if (remaining > 0) {
        const actors = new Set(Array.from(region.tokens, regionToken => regionToken.actor).filter(actor => actor && actorUtils.getEffectByIdentifier(actor, 'sanctumOfTheShepherd', {multiple: true}).some(marker => getRegionUuid(marker) === regionUuid)));
        const effectData = documentUtils.getEffectData(activity, wardEffect.id, {duration: {value: remaining, units: 'seconds'}, activityUuid: activity.uuid});
        await Promise.all(Array.from(actors, actor => effectUtils.createEffects(actor, [effectData])));
    }
    await documentUtils.deleteDocument(sourceEffect);
}
export const sanctumOfTheShepherd = {
    name: 'Sanctum of the Shepherd',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        creatures: {
            default: 'max(@mod, 1)',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Modern.SanctumOfTheShepherd.CreaturesHint',
            category: 'homebrew'
        }
    }
};
export const sanctumOfTheShepherdMarker = {
    name: 'Sanctum of the Shepherd: Marker',
    version: sanctumOfTheShepherd.version,
    rules: sanctumOfTheShepherd.rules,
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ]
};
