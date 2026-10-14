import cprConstants from '../../../constants.mjs';
import {activityUtils, actorUtils, automationUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, summonUtils, workflowUtils} from '../../../proxy.mjs';
const creatureTypes = {
    'summon-beast-air': 'air',
    'summon-beast-land': 'land',
    'summon-beast-water': 'water'
};
const typeFeatures = {
    air: [{identifier: 'summon-beast-flyby', translate: 'Flyby'}],
    land: [{identifier: 'summon-beast-pack-tactics', translate: 'PackTactics'}],
    water: [{identifier: 'summon-beast-pack-tactics', translate: 'PackTactics'}, {identifier: 'summon-beast-water-breathing', translate: 'WaterBreathing'}]
};
const typeSpeeds = {
    air: 'fly',
    land: 'climb',
    water: 'swim'
};
const translations = 'CHRISPREMADES.Macros.All.SummonBeast.';
async function getFeature(identifier, {translate, flatAttack} = {}) {
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, identifier, {object: true, translate, flatAttack});
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const rules = documentUtils.getRules(document) === '2024' ? '2024' : '2014';
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs[rules === '2024' ? 'modern' : 'legacy'].summons, 'bestialSpirit');
    if (!sourceActor) {
        Logging.addMacroWarning('CPR', 'summon-beast', 'CHRISPREMADES.Error.ActorNotFound', {notify: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const attackName = rules === '2024' ? 'Rend' : 'Maul';
    const items = await Promise.all([
        getFeature('multiattack', {translate: _loc(translations + 'Multiattack', {numAttacks: Math.floor(spellLevel / automationUtils.getConfigValue(document, 'attacksDivisor'))})}),
        getFeature('summon-beast-' + attackName.toLowerCase(), {translate: translations + attackName, flatAttack: itemUtils.getSpellAttackBonus(document)}),
        ...typeFeatures[creatureType].map(entry => getFeature(entry.identifier, {translate: translations + entry.translate}))
    ]);
    if (items[1]) itemUtils.addDamageBonus(items[1], spellLevel);
    if (items.some(item => !item)) {
        Logging.addMacroWarning('CPR', 'summon-beast', 'CHRISPREMADES.Error.MissingPackItem', {notify: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const hp = automationUtils.getConfigValue(document, creatureType + 'HitPoints') + ((spellLevel - 2) * automationUtils.getConfigValue(document, 'hitPointsPerLevel'));
    const updates = {
        system: {
            details: {cr: actorUtils.getCR(workflow.actor)},
            attributes: {
                ac: {flat: automationUtils.getConfigValue(document, 'baseArmorClass') + spellLevel},
                hp: {formula: String(hp), max: hp, value: hp},
                movement: {speeds: {[typeSpeeds[creatureType]]: automationUtils.getConfigValue(document, creatureType + 'Speed')}}
            }
        }
    };
    genericUtils.setProperty(updates, 'flags.cat.automation.rules', rules);
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || _loc('CHRISPREMADES.Summons.CreatureNames.BestialSpirit' + creatureType.capitalize()),
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        duration: activityUtils.getDuration(workflow.activity),
        initiative: 'follows',
        parent: concentrationEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
const summonConfig = (creatureType, hitPoints, speed, animation) => ({
    [creatureType + 'HitPoints']: {default: hitPoints, type: 'number', label: 'CHRISPREMADES.Config.HitPoints', category: 'homebrew'},
    [creatureType + 'Speed']: {default: speed, type: 'number', label: 'CHRISPREMADES.Macros.All.SummonBeast.' + creatureType.capitalize() + 'Speed', category: 'homebrew'},
    [creatureType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
    [creatureType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
    [creatureType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
    [creatureType + 'Animation']: {default: {source: 'chris-premades', identifier: animation}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
});
export const summonBeast = {
    name: 'Summon Beast',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        baseArmorClass: {
            default: 11,
            type: 'number',
            label: 'DND5E.ArmorClass',
            category: 'homebrew'
        },
        hitPointsPerLevel: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.SummonBeast.HitPointsPerLevel',
            category: 'homebrew'
        },
        attacksDivisor: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.SummonBeast.AttacksDivisor',
            hint: 'CHRISPREMADES.Macros.All.SummonBeast.AttacksDivisorHint',
            category: 'homebrew'
        },
        range: {
            default: 90,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        ...summonConfig('air', 20, 60, 'airSummon'),
        ...summonConfig('land', 30, 30, 'earthSummon'),
        ...summonConfig('water', 30, 30, 'waterSummon')
    }
};
