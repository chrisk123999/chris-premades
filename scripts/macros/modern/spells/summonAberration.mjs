import cprConstants from '../../../constants.mjs';
import {automationUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, summonUtils, workflowUtils} from '../../../proxy.mjs';
import {addThrallBonuses} from '../classFeatures/warlock/greatOldOne/createThrall.mjs';
const creatureTypes = {
    'summon-aberration-beholderkin': 'beholderkin',
    'summon-aberration-slaad': 'slaad',
    'summon-aberration-mind-flayer': 'mindFlayer'
};
const translations = 'CHRISPREMADES.Macros.Modern.SummonAberration.';
const typeItems = {
    beholderkin: [{identifier: 'summon-aberration-eye-ray', translate: translations + 'EyeRay', flatAttack: true}],
    slaad: [{identifier: 'summon-aberration-claws', translate: translations + 'Claws', flatAttack: true}, {identifier: 'summon-aberration-regeneration', translate: translations + 'Regeneration', hidden: true}],
    mindFlayer: [{identifier: 'summon-aberration-psychic-slam', translate: translations + 'PsychicSlam', flatAttack: true}, {identifier: 'summon-aberration-whispering-aura', translate: translations + 'WhisperingAura', flatDC: true, hidden: true}]
};
async function getFeature(identifier, {translate, flatAttack, flatDC} = {}) {
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.monsterFeatures, identifier, {object: true, translate, flatAttack, flatDC});
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.summons, 'aberrantSpirit');
    if (!sourceActor) {
        Logging.addMacroError('Missing the Aberrant Spirit summon actor!');
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const saveDC = itemUtils.getSaveDC(document);
    const items = [await getFeature('summon-aberration-multiattack', {translate: translations + 'Multiattack'})];
    for (const entry of typeItems[creatureType]) {
        items.push(await getFeature(entry.identifier, {translate: entry.translate, flatAttack: entry.flatAttack ? spellLevel : undefined, flatDC: entry.flatDC ? saveDC : undefined}));
    }
    if (items.some(item => !item)) {
        Logging.addMacroError('Missing an Aberrant Spirit summon feature!');
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const hp = automationUtils.getConfigValue(document, 'baseHitPoints') + ((spellLevel - 4) * 10);
    let updates = {
        system: {
            attributes: {
                ac: {flat: 11 + spellLevel},
                hp: {formula: String(hp), max: hp, value: hp}
            }
        }
    };
    if (creatureType === 'beholderkin') genericUtils.setProperty(updates, 'system.attributes.movement', {fly: 30, hover: true});
    if (workflow.workflowOptions['chris-premades']?.createThrall) updates = addThrallBonuses(updates, workflow);
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || undefined,
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        duration: activityDuration(workflow),
        initiative: 'follows',
        parent: concentrationEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
function activityDuration(workflow) {
    return workflow.activity.duration?.value ? workflow.activity.duration.value * 60 : 3600;
}
export const summonAberration = {
    name: 'Summon Aberration',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        baseHitPoints: {
            default: 40,
            type: 'number',
            label: 'CHRISPREMADES.Config.HitPoints',
            category: 'homebrew'
        },
        range: {
            default: 90,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        beholderkinName: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
        beholderkinToken: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
        beholderkinAvatar: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
        beholderkinAnimation: {default: {source: 'chris-premades', identifier: 'shadowSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'},
        slaadName: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
        slaadToken: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
        slaadAvatar: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
        slaadAnimation: {default: {source: 'chris-premades', identifier: 'shadowSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'},
        mindFlayerName: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
        mindFlayerToken: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
        mindFlayerAvatar: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
        mindFlayerAnimation: {default: {source: 'chris-premades', identifier: 'shadowSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
    }
};
