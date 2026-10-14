import {activityUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getBondData(effect) {
    return {tokens: [], ...effect.flags['chris-premades']?.wardingBond};
}
async function endExistingBonds(actor) {
    const effects = ['wardingBondSource', 'wardingBondTarget'].flatMap(identifier => documentUtils.getEffectByIdentifier(actor, identifier, {multiple: true}) ?? []);
    if (effects.length) await documentUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', effects.map(effect => effect.id));
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'warding-bond') return;
    if (!workflow.token) return Logging.addMacroWarning('CPR', 'warding-bond', 'CHRISPREMADES.Macros.All.WardingBond.NoToken', {notify: true});
    const targets = Array.from(workflow.targets).filter(token => token.actor && token.document.uuid !== workflow.token.document.uuid);
    if (!targets.length) return Logging.addMacroWarning('CPR', 'warding-bond', 'No target selected.');
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'wardingBondSource');
    const targetEffect = documentUtils.getEffectByIdentifier(document, 'wardingBondTarget');
    if (!sourceEffect || !targetEffect) return Logging.addMacroWarning('CPR', 'warding-bond', 'Warding Bond effects missing from item.', {notify: 'warn'});
    const maxDistance = automationUtils.getConfigValue(document, 'maxDistance');
    for (const target of targets) await endExistingBonds(target.actor);
    const sourceEffectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {activityUuid: workflow.activity.uuid});
    genericUtils.setProperty(sourceEffectData, 'flags.chris-premades.wardingBond', {tokens: targets.map(token => token.document.uuid), maxDistance});
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [sourceEffectData]);
    if (!casterEffect) return;
    const targetEffectData = documentUtils.getEffectData(workflow.activity, targetEffect.id, {parentEntity: casterEffect, activityUuid: workflow.activity.uuid});
    genericUtils.setProperty(targetEffectData, 'flags.chris-premades.wardingBond', {tokens: [workflow.token.document.uuid], maxDistance});
    await Promise.all(targets.map(token => effectUtils.createEffects(token.actor, [targetEffectData])));
}
async function dismiss({workflow}) {
    if (workflow.activity.identifier !== 'dismiss') return;
    const effects = documentUtils.getEffectByIdentifier(workflow.actor, 'wardingBondSource', {multiple: true}) ?? [];
    if (!effects.length) return Logging.addMacroWarning('CPR', 'warding-bond', 'No active Warding Bond to dismiss.');
    await documentUtils.deleteEmbeddedDocuments(workflow.actor, 'ActiveEffect', effects.map(effect => effect.id));
}
async function damaged({document: effect, ditem}) {
    const damage = Math.floor(ditem.totalDamage ?? 0);
    if (damage <= 0) return;
    const casterToken = fromUuidSync(getBondData(effect).tokens[0], {strict: false});
    if (!casterToken?.actor) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'damage') : undefined;
    if (!activity) return Logging.addMacroWarning('CPR', 'warding-bond', 'Damage activity missing from item.', {notify: 'warn'});
    const activityData = activityUtils.getDamageModifiedActivityData(activity, String(damage));
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [casterToken]);
}
async function moved({document: effect, token}) {
    const {tokens, maxDistance} = getBondData(effect);
    if (!maxDistance) return;
    const partners = tokens.map(uuid => fromUuidSync(uuid, {strict: false})).filter(partner => partner?.parent === token.parent);
    if (!partners.some(partner => tokenUtils.getDistance(token, partner) > maxDistance)) return;
    const selection = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.All.WardingBond.Distance'), {userId: queryUtils.gmID()});
    if (!selection) return;
    await documentUtils.deleteDocument(effect);
}
async function removed({document: effect}) {
    const sourceEffect = fromUuidSync(effect.flags.dnd5e?.dependentOn, {strict: false});
    if (sourceEffect) await documentUtils.deleteDocument(sourceEffect);
}
export const wardingBond = {
    name: 'Warding Bond',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: dismiss,
            priority: 50
        }
    ],
    config: {
        maxDistance: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.All.WardingBond.MaxDistanceHint',
            category: 'homebrew'
        }
    }
};
export const wardingBondSource = {
    name: 'Warding Bond: Source',
    version: wardingBond.version,
    rules: wardingBond.rules,
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};
export const wardingBondTarget = {
    name: 'Warding Bond: Target',
    version: wardingBond.version,
    rules: wardingBond.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: damaged,
            priority: 200
        }
    ],
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};
