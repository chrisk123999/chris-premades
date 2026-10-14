import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const creatureTypes = {
    'summon-fey-fuming': 'fuming',
    'summon-fey-mirthful': 'mirthful',
    'summon-fey-tricksy': 'tricksy'
};
const translations = 'CHRISPREMADES.Macros.Legacy.SummonFey.';
async function getFeature(identifier, {translate, flatAttack, flatDC, pack = cprConstants.packs.misc.automationItems} = {}) {
    return await compendiumUtils.getDocumentByIdentifier(pack, identifier, {object: true, translate, flatAttack, flatDC});
}
async function getMoodFeature(document, creatureType) {
    const featureID = 'summon-fey-' + (creatureType === 'tricksy' ? creatureType + '-legacy' : creatureType);
    const feature = await getFeature(featureID, {
        translate: translations + creatureType.capitalize(),
        flatDC: creatureType === 'mirthful' ? itemUtils.getSaveDC(document) : undefined
    });
    if (feature && creatureType === 'tricksy') genericUtils.setProperty(feature, 'flags.cat.config', {
        ...automationUtils.getConfigValues(document, ['useRealDarkness', 'darknessAnimation']),
        spreadAroundCorners: true,
        animation: {source: 'chris-premades', identifier: 'darknessSphere'}
    });
    return feature;
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.summons, 'feySpirit');
    if (!sourceActor) {
        Logging.addMacroWarning('CPR', 'summon-fey', 'CHRISPREMADES.Error.ActorNotFound', {notify: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const items = await Promise.all([
        getFeature('multiattack', {translate: _loc(translations + 'Multiattack', {numAttacks: Math.floor(spellLevel / 2)})}),
        getFeature('summon-fey-shortsword', {translate: translations + 'Shortsword', flatAttack: itemUtils.getSpellAttackBonus(document)}),
        getFeature('fey-step', {translate: translations + 'FeyStep', pack: cprConstants.packs.legacy.monsterFeatures}),
        getMoodFeature(document, creatureType)
    ]);
    if (items[1]) itemUtils.addDamageBonus(items[1], spellLevel);
    if (items.some(item => !item)) {
        Logging.addMacroWarning('CPR', 'summon-fey', 'CHRISPREMADES.Error.MissingPackItem', {notify: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const hp = automationUtils.getConfigValue(document, 'baseHitPoints') + ((spellLevel - 3) * 10);
    const updates = {
        system: {
            details: {cr: actorUtils.getCR(workflow.actor)},
            attributes: {
                ac: {flat: 12 + spellLevel},
                hp: {formula: String(hp), max: hp, value: hp}
            }
        }
    };
    genericUtils.setProperty(updates, 'flags.cat.automation.rules', '2014');
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || _loc('CHRISPREMADES.Summons.CreatureNames.FeySpirit' + creatureType.capitalize()),
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        duration: 3600,
        initiative: 'follows',
        parent: concentrationEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function feyStep({document, workflow}) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(workflow.token.document, {range: workflow.activity.range.value, animation, options});
    const tricksy = 'summon-fey-tricksy-' + (documentUtils.getRules(workflow.actor) === '2014' ? 'legacy' : 'modern');
    const moodItem = actorUtils.getItemByIdentifiers(workflow.actor, ['summon-fey-fuming', 'summon-fey-mirthful', tricksy]);
    if (!moodItem) return;
    const identifier = documentUtils.getIdentifier(moodItem);
    if (identifier === 'summon-fey-fuming') return await workflowUtils.completeItemUse(moodItem);
    if (identifier === tricksy) return await workflowUtils.syntheticItemRoll(moodItem);
    const nearby = tokenUtils.findNearby(workflow.token.document, 10, {disposition: 'enemy'});
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(document.name + ': ' + moodItem.name, translations + 'Select', nearby);
    if (!selection?.result) return;
    await workflowUtils.syntheticItemRoll(moodItem, [selection.result]);
}
const summonConfig = creatureType => ({
    [creatureType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
    [creatureType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
    [creatureType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
    [creatureType + 'Animation']: {default: {source: 'chris-premades', identifier: 'natureSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
});
export const summonFey = {
    name: 'Summon Fey',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        baseHitPoints: {
            default: 30,
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
        ...summonConfig('fuming'),
        ...summonConfig('mirthful'),
        ...summonConfig('tricksy'),
        useRealDarkness: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.RealDarkness',
            category: 'mechanics'
        },
        darknessAnimation: cprConstants.darknessAnimationConfig
    }
};
export const summonFeyFeyStep = {
    name: 'Fey Step',
    version: summonFey.version,
    rules: summonFey.rules,
    roll: [
        {pass: 'itemRollFinished', macro: feyStep, priority: 50}
    ],
    config: {
        animation: {
            default: {source: 'chris-premades', identifier: 'mistyStep'},
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
