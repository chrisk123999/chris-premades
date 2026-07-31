import {actorUtils, automationUtils, compendiumUtils, crosshairUtils, dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, summonUtils, tokenUtils} from '../../../../../proxy.mjs';
const mindActivities = ['manifestMindCast', 'manifestMindMove', 'manifestMindDismiss'];
async function use({document: item, workflow}) {
    if (workflow.activity.identifier !== 'manifestMind') return;
    const sourceActor = await compendiumUtils.getDocumentByIdentifier('chris-premades.CPRSummons2014', 'manifestMind');
    if (!sourceActor) return;
    let name = automationUtils.getConfigValue(item, 'name');
    if (!name?.length) name = _loc('CHRISPREMADES.Macros.Legacy.ManifestMind.SummonName');
    const avatarImg = automationUtils.getConfigValue(item, 'avatar') || undefined;
    const tokenImg = automationUtils.getConfigValue(item, 'token') || undefined;
    const animation = automationUtils.getConfigValue(item, 'animation');
    const effectData = documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'manifestMind',
        activityUuid: workflow.activity.uuid,
        unhideActivities: mindActivities,
        unhideActivitiesFavorite: true,
        macros: [{type: 'combat', macros: [{source: 'chris-premades', rules: '2014', identifier: 'manifest-mind'}]}]
    });
    const [markerEffect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    if (!markerEffect) return;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name,
        avatarImg,
        tokenImg,
        animation,
        disposition: workflow.token.document.disposition,
        parent: markerEffect,
        sourceDocument: item
    });
    if (!summon) return;
    if (workflow.token) await summonUtils.placeSummons([summon], 60, {token: workflow.token.document});
}
async function cast({document: item, workflow}) {
    if (workflow.activity.identifier !== 'manifestMindCast') return;
    const [summon] = summonUtils.getSummonBySource(item);
    const mindToken = summon?.token;
    if (!mindToken) return;
    const effectData = documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {seconds: 1},
        changes: [{key: 'flags.midi-qol.rangeOverride.attack.all', mode: 0, value: 1, priority: 20}],
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'manifest-mind-cast'}]}]
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [effectData], {specialDuration: ['spellCast']});
    const [mindEffect] = await effectUtils.createEffects(mindToken.actor, [effectData], {specialDuration: ['spellCast']});
    if (casterEffect && mindEffect) await documentUtils.makeDependent(casterEffect, [mindEffect]);
}
async function move({document: item, workflow}) {
    if (workflow.activity.identifier !== 'manifestMindMove') return;
    const [summon] = summonUtils.getSummonBySource(item);
    const mindToken = summon?.token;
    if (!mindToken) return;
    const result = await crosshairUtils.aimCrosshair({token: mindToken, maxRange: 30, centerpoint: mindToken.object?.center});
    if (!result || result.cancelled) return;
    await tokenUtils.moveToken(mindToken, [{x: result.x, y: result.y, action: 'displace'}]);
}
async function dismiss({document: item, workflow}) {
    if (workflow.activity.identifier !== 'manifestMindDismiss') return;
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function turnEnd({document: effect, token}) {
    const item = actorUtils.getItemByIdentifier(effect.parent, 'manifest-mind');
    const [summon] = item ? summonUtils.getSummonBySource(item) : [];
    const mindToken = summon?.token;
    if (!mindToken) return await documentUtils.deleteDocument(effect);
    if (tokenUtils.getDistance(token, mindToken) > 300) {
        const selection = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.ManifestMind.Far', {actorName: token.actor.name}), {userId: queryUtils.gmID()});
        if (!selection) return;
        await documentUtils.deleteDocument(effect);
    }
}
async function early({activity, actor}) {
    if (activity.item.type !== 'spell') {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.ManifestMind.Invalid', {type: 'info'});
        return true;
    }
    const effect = actorUtils.getEffectByIdentifier(actor, 'manifestMind');
    const originItem = actorUtils.getItemByIdentifier(actor, 'manifest-mind');
    if (!effect || !originItem) return true;
}
export const manifestMind = {
    name: 'Manifest Mind: Summon',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: cast, priority: 50},
        {pass: 'itemRollFinished', macro: move, priority: 50},
        {pass: 'itemRollFinished', macro: dismiss, priority: 50}
    ],
    combat: [
        {pass: 'actorTurnEnd', macro: turnEnd, priority: 50}
    ],
    config: {
        name: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
        token: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
        avatar: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
        animation: {default: {source: 'chris-premades', identifier: 'defaultSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
    }
};
export const manifestMindCast = {
    name: 'Manifest Mind: Cast',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorPreTargeting', macro: early, priority: 50}
    ]
};
