import cprConstants from '../../../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, DamageBonus, documentUtils, genericUtils, itemUtils, summonUtils, workflowUtils} from '../../../../../proxy.mjs';
const creatureTypes = {
    'primal-companion-land': 'land',
    'primal-companion-sea': 'sea',
    'primal-companion-sky': 'sky'
};
const creatureNames = {
    land: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheLand',
    sea: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSea',
    sky: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSky'
};
const beastFeatures = {
    land: ['primal-companion-beasts-strike-land'],
    sea: ['primal-companion-amphibious', 'primal-companion-beasts-strike-sea'],
    sky: ['primal-companion-flyby', 'primal-companion-beasts-strike-sky']
};
const movement = {
    land: {walk: 40, climb: 40},
    sea: {walk: 5, swim: 60},
    sky: {walk: 10, fly: 60}
};
const actions = ['dash', 'disengage', 'dodge', 'help'];
const commandActivity = 'primal-companion-command';
async function getFeatures(packId, identifiers, options) {
    return await Promise.all(identifiers.map(identifier => compendiumUtils.getDocumentByIdentifier(packId, identifier, {object: true, ...options})));
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const levels = workflow.actor.classes?.[automationUtils.getConfigValue(document, 'classIdentifier')]?.system.levels;
    if (!levels) return;
    const prof = workflow.actor.system.attributes.prof;
    const wisdom = workflow.actor.system.abilities.wis.mod;
    const [sourceActor, features, actionItems] = await Promise.all([
        compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.summons, 'primalCompanion'),
        getFeatures(cprConstants.packs.modern.monsterFeatures, ['primal-companion-primal-bond', ...beastFeatures[creatureType]], {flatAttack: prof + wisdom}),
        getFeatures(cprConstants.packs.modern.misc, actions)
    ]);
    if (!sourceActor) return genericUtils.notify('CHRISPREMADES.Error.ActorNotFound', {type: 'warn'});
    const items = [...features, ...actionItems];
    if (items.some(itemData => !itemData)) return genericUtils.notify('CHRISPREMADES.Error.MissingPackItem', {type: 'warn'});
    items.forEach(itemData => {
        if (!Object.values(itemData.system.activities ?? {}).some(activityData => activityData.type === 'attack')) return;
        const macros = genericUtils.getProperty(itemData, 'flags.cat.macros.roll') ?? [];
        macros.push({source: 'chris-premades', rules: 'all', identifier: 'selectDamageType'});
        genericUtils.setProperty(itemData, 'flags.cat.macros.roll', macros);
    });
    const hitPoints = creatureType === 'sky' ? 4 + (4 * levels) : 5 + (5 * levels);
    const updates = {
        system: {
            details: {cr: actorUtils.getCR(workflow.actor)},
            attributes: {
                ac: {flat: 13 + wisdom},
                hp: {formula: String(hitPoints), max: hitPoints, value: hitPoints},
                movement: movement[creatureType]
            }
        }
    };
    if (creatureType === 'sky') updates.system.abilities = {str: {value: 6}, dex: {value: 16}, con: {value: 13}};
    for (const existing of summonUtils.getSummonsBySource(document)) await summonUtils.deleteSummon(existing);
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        size: creatureType === 'sky' ? 'sm' : undefined,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || _loc(creatureNames[creatureType]),
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        initiative: 'follows',
        sourceDocument: document
    });
    if (!summon) return;
    await itemUtils.unhideActivities(document, [commandActivity], {favorite: true});
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function deleted({document, summon}) {
    if (summonUtils.getSummonsBySource(document).some(existing => existing !== summon)) return;
    await itemUtils.rehideActivities(document, [commandActivity], {favorite: true});
}
async function fury({document: item, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const owner = summonUtils.getSummonData(workflow.actor)?.owner;
    if (!owner || !actorUtils.getItemByIdentifier(owner, 'bestial-fury')) return;
    const markData = documentUtils.getEffectByIdentifier(owner, 'huntersMark')?.flags['chris-premades']?.huntersMark;
    const target = workflow.hitTargets.first().document;
    if (!markData?.targets.includes(target.uuid)) return;
    if (!item.system.uses.value) return;
    const bonus = new DamageBonus(item, {formula: markData.formula, optional: false, maxTargets: 1, type: markData.damageType})
        .withOnUse(async () => await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1}));
    bonus.targets = [target];
    return bonus;
}
const summonConfig = (creatureType, animation) => ({
    [creatureType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', i18nOption: creatureNames[creatureType], category: 'summons'},
    [creatureType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', i18nOption: creatureNames[creatureType], category: 'summons'},
    [creatureType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', i18nOption: creatureNames[creatureType], category: 'summons'},
    [creatureType + 'Animation']: {default: {source: 'chris-premades', identifier: animation}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', i18nOption: creatureNames[creatureType], category: 'animations'}
});
export const primalCompanion = {
    name: 'Primal Companion',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    summon: [
        {pass: 'delete', macro: deleted, priority: 50}
    ],
    config: {
        classIdentifier: {
            default: 'ranger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        range: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        ...summonConfig('land', 'earthSummon'),
        ...summonConfig('sea', 'waterSummon'),
        ...summonConfig('sky', 'airSummon')
    }
};
export const bestialFury = {
    name: 'Bestial Fury',
    version: primalCompanion.version,
    rules: primalCompanion.rules,
    roll: [
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: fury, priority: 250}
    ]
};
