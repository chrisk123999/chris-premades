import {custom} from '../events/custom.js';
import {actorUtils, effectUtils, genericUtils, macroUtils, templateUtils} from '../utils.js';
function preCreateMeasuredTemplate(template, updates, options, userId) {
    let originActivityUuid = genericUtils.getProperty(template, 'flags.dnd5e.origin');
    if (!originActivityUuid) return;
    let activity = fromUuidSync(originActivityUuid, {strict: false});
    if (!activity) return;
    if (!template.flags['chris-premades']?.rules) {
        let rules = genericUtils.getRules(activity.item);
        let identifier = genericUtils.getIdentifier(activity.item);
        if (identifier) {
            let macro = custom.getMacro(identifier, rules);
            if (macro?.legacyTemplate) rules = 'legacy';
        }
        template.updateSource({'flags.chris-premades.rules': rules});
    }
    /*let embeddedActivityEntityMacros = macroUtils.getEmbeddedActivityShapeMacros(activity, 'template');
    if (embeddedActivityEntityMacros.length) {
        let flagData = {};
        let types = new Set(embeddedActivityEntityMacros.map(i => i.type));
        types.forEach(i => {
            genericUtils.setProperty(flagData, i, embeddedActivityEntityMacros.filter(j => j.type === i));
        });
        template.updateSource({'flags.chris-premades.embeddedMacros': flagData});
    } */
}
async function templateEffectTokenEnter(template, token) {
    genericUtils.log('dev', 'Template Effect Entered: ' + template.id);
    let originItemUuid = template.flags.dnd5e?.item;
    if (!originItemUuid) return;
    let originItem = await fromUuid(originItemUuid);
    if (!originItem) return;
    if (!(originItem instanceof Item)) return;
    let originActivityUuid = template.flags.dnd5e?.origin;
    let activity = await fromUuid(originActivityUuid);
    if (!activity) return;
    let effects = originItem.effects.filter(effect => effect.flags['chris-premades']?.templateEffectActivities?.includes(activity.id));
    if (!effects.length) return;
    let effectDatas = effects.map(effect => {
        if (actorUtils.getEffects(token.actor).find(i => i.name === effect.name && effect.origin === template.uuid)) return false;
        let effectData = genericUtils.duplicate(effect.toObject());
        effectData.origin = template.uuid;
        effectData.duration = {};
        genericUtils.setProperty(effectData, 'flags.dae.showIcon', true);
        return effectData;
    }).filter(i => i);
    if (!effectDatas.length) return;
    await genericUtils.createEmbeddedDocuments(token.actor, 'ActiveEffect', effectDatas);
    let oldTokens = template.flags['chris-premades']?.templateEffect?.tokens ?? [];
    await genericUtils.setFlag(template, 'chris-premades', 'templateEffect.tokens', [...oldTokens, token.document.uuid]);
}
async function templateEffectTokenLeave(template, token) {
    genericUtils.log('dev', 'Template Effect Left: ' + template.id);
    let effects = actorUtils.getEffects(token.actor).filter(effect => effect.origin === template.uuid);
    if (!effects.length) return;
    await genericUtils.deleteEmbeddedDocuments(token.actor, 'ActiveEffect', effects.map(effect => effect.id));
    let oldTokens = template.flags['chris-premades']?.templateEffect?.tokens ?? [];
    await genericUtils.setFlag(template, 'chris-premades', 'templateEffect.tokens', oldTokens.filter(i => i != token.document.uuid));
}
async function templateEffectMoved(template) {
    genericUtils.log('dev', 'Template Effect Moved: ' + template.id);
    let oldTokenUuids = template.flags['chris-premades']?.templateEffect?.tokens ?? [];
    let oldTokens = (await Promise.all(oldTokenUuids.map(async uuid => await fromUuid(uuid)))).filter(i => i);
    let tokens = templateUtils.getTokensInTemplate(template);
    let remove = oldTokens.filter(token => !tokens.has(token));
    let add = tokens.filter(token => !oldTokens.includes(token));
    for (let token of remove) await templateEffectTokenLeave(template, token.object);
    for (let token of add) await templateEffectTokenEnter(template, token);
}
async function templateEffectDeleted(template) {
    genericUtils.log('dev', 'Template Effect Deleted: ' + template.id);
    let oldTokens = template?.flags?.['chris-premades']?.templateEffect?.tokens ?? [];
    for (let uuid of oldTokens) {
        let token = await fromUuid(uuid);
        if (!token) continue;
        let effects = actorUtils.getEffects(token.actor).filter(effect => effect.origin === template.uuid);
        if (!effects.length) continue;
        await genericUtils.deleteEmbeddedDocuments(token.actor, 'ActiveEffect', effects.map(effect => effect.id));
    }
}
async function templateEffectCreated(template) {
    genericUtils.log('dev', 'Template Effect Created: ' + template.id);
    let tokens = templateUtils.getTokensInTemplate(template);
    if (!tokens.size) return;
    for (let token of tokens) await templateEffectTokenEnter(template, token);
}
export let template = {
    preCreateMeasuredTemplate,
    templateEffectTokenEnter,
    templateEffectTokenLeave,
    templateEffectMoved,
    templateEffectDeleted,
    templateEffectCreated
};