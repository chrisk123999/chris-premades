import cprConstants from '../../../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, DamageBonus, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.DrakeCompanion.';
const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison'];
const sizes = ['sm', 'med', 'lg'];
async function getFeature(identifier, translate) {
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.monsterFeatures, identifier, {object: true, translate});
}
function getUpgrades(actor, classIdentifier) {
    const classLevel = actor.classes?.[classIdentifier]?.system.levels;
    if (!classLevel) return;
    return {classLevel, upgrades: Math.floor((classLevel + 1) / 8)};
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'drake-companion-summon') return;
    const levels = getUpgrades(workflow.actor, automationUtils.getConfigValue(document, 'classIdentifier'));
    if (!levels) return;
    const {classLevel, upgrades} = levels;
    const damageType = await dialogUtils.selectDamageType(damageTypes, document.name, translations + 'Select');
    if (!damageType) return;
    const [sourceActor, ...items] = await Promise.all([
        compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.summons, 'drakeCompanion'),
        getFeature('drake-companion-draconic-essence', translations + 'DraconicEssence'),
        getFeature('drake-companion-infused-strikes', translations + 'InfusedStrikes'),
        getFeature('drake-companion-bite', translations + 'Bite'),
        getFeature('drake-companion-dodge', translations + 'Dodge')
    ]);
    if (!sourceActor) return genericUtils.notify('CHRISPREMADES.Error.ActorNotFound', {type: 'warn'});
    if (items.some(item => !item)) return genericUtils.notify('CHRISPREMADES.Error.MissingPackItem', {type: 'warn'});
    const [, strikes, bite] = items;
    genericUtils.setProperty(strikes, 'flags.cat.config.damageType', damageType);
    if (upgrades) Object.values(bite.system.activities)[0].damage.parts.push({number: upgrades, denomination: 6, types: [damageType]});
    const prof = workflow.actor.system.attributes.prof;
    const hp = 5 + (classLevel * 5);
    const updates = {
        system: {
            details: {cr: (4 * prof) - 7},
            attributes: {
                ac: {flat: 14 + prof},
                hp: {formula: String(hp), max: hp, value: hp}
            },
            traits: {di: {value: [damageType]}}
        }
    };
    if (upgrades) genericUtils.setProperty(updates, 'system.attributes.movement.fly', 40);
    const markerEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'drakeCompanion',
        activityUuid: workflow.activity.uuid,
        changes: upgrades ? [{key: 'system.traits.dr.value', value: damageType, priority: 20, type: 'add'}] : [],
        macros: upgrades > 1 ? [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'drake-companion-resistance'}]}] : undefined,
        unhideActivities: ['drake-companion-command'],
        favoriteActivities: true
    });
    for (const existing of summonUtils.getSummonsBySource(document)) await summonUtils.deleteSummon(existing);
    const [markerEffect] = await effectUtils.createEffects(workflow.actor, [markerEffectData]);
    if (!markerEffect) return;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        size: sizes[upgrades],
        name: automationUtils.getConfigValue(document, damageType + 'Name') || _loc('CHRISPREMADES.Summons.CreatureNames.DrakeCompanion' + damageType.capitalize()),
        tokenImg: automationUtils.getConfigValue(document, damageType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, damageType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, damageType + 'Animation'),
        disposition: workflow.token.document.disposition,
        initiative: 'follows',
        parent: markerEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function resistance({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    const actor = effectUtils.getActor(document);
    if (!actor || actorUtils.hasUsedReaction(actor)) return;
    const sourceItem = actorUtils.getItemByIdentifier(actor, 'drake-companion-summon');
    const activity = sourceItem ? itemUtils.getActivityByIdentifier(sourceItem, 'drake-companion-reflexive-resistance') : undefined;
    if (!activity?.uses.value) return;
    const ownerToken = actorUtils.getFirstToken(actor);
    const summonToken = summonUtils.getSummonsByIdentifier('drakeCompanion', {actor})[0]?.token;
    if (!ownerToken || !summonToken) return;
    const hitOwner = workflow.hitTargets.has(ownerToken.object);
    const hitSummon = workflow.hitTargets.has(summonToken.object);
    if (!hitOwner && !hitSummon) return;
    if (tokenUtils.getDistance(ownerToken, summonToken) > automationUtils.getConfigValue(sourceItem, 'reactionRange')) return;
    const userId = queryUtils.firstOwner(actor, true);
    let selection;
    if (hitOwner && hitSummon) {
        selection = await dialogUtils.buttonDialog(activity.name, translations + 'Resistance', [
            [translations + 'Self', 'self'],
            [translations + 'Summon', 'summon'],
            ['COMMON.No', false]
        ], {userId});
    } else {
        const confirmed = await dialogUtils.confirm(activity.name, translations + (hitOwner ? 'ResistanceSelf' : 'Resistance'), {userId});
        selection = confirmed ? (hitOwner ? 'self' : 'summon') : false;
    }
    if (!selection) return;
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.name,
        img: sourceItem.img,
        origin: sourceItem.uuid,
        identifier: 'drakeCompanionReflexiveResistance',
        specialDuration: ['damaged'],
        changes: [{key: 'system.traits.dr.value', value: 'ALL', priority: 20, type: 'add'}]
    });
    await effectUtils.createEffects(selection === 'self' ? actor : summonToken.actor, [effectData]);
    await actorUtils.setReactionUsed(actor);
    await documentUtils.update(activity, {'uses.spent': activity.uses.spent + 1});
}
async function infuse({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const damageType = automationUtils.getConfigValue(document, 'damageType');
    if (!damageType) return;
    const actor = document.actor;
    if (actorUtils.hasUsedReaction(actor)) return;
    const summonToken = actorUtils.getFirstToken(actor);
    if (!summonToken || tokenUtils.isEnemy(summonToken, workflow.token.document)) return;
    if (tokenUtils.getDistance(summonToken, workflow.token.document) > automationUtils.getConfigValue(document, 'range')) return;
    if (!tokenUtils.canSee(summonToken, workflow.token.document)) return;
    const bonus = new DamageBonus(document, {formula: automationUtils.getConfigValue(document, 'formula'), type: damageType, actor, action: 'reaction'})
        .withDefaultCosts()
        .withDefaultRequest()
        .withValidation(() => !actorUtils.hasUsedReaction(actor))
        .withOnUse(async () => actorUtils.setReactionUsed(actor));
    bonus.targets = Array.from(workflow.hitTargets, token => token.document);
    return bonus;
}
const imageConfig = damageType => ({
    [damageType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
    [damageType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
    [damageType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
    [damageType + 'Animation']: {default: {source: 'chris-premades', identifier: 'fireSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
});
export const drakeCompanionSummon = {
    name: 'Drake Companion: Summon',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        classIdentifier: {
            default: 'ranger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        reactionRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.DrakeCompanion.ReactionRange',
            category: 'homebrew'
        },
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        ...imageConfig('acid'),
        ...imageConfig('cold'),
        ...imageConfig('fire'),
        ...imageConfig('lightning'),
        ...imageConfig('poison')
    }
};
export const drakeCompanionResistance = {
    name: 'Drake Companion: Reflexive Resistance',
    version: drakeCompanionSummon.version,
    rules: drakeCompanionSummon.rules,
    roll: [
        {pass: 'sceneAttackRollComplete', macro: resistance, priority: 50},
        {pass: 'sceneSavesComplete', macro: resistance, priority: 50}
    ]
};
export const drakeCompanionInfuse = {
    name: 'Drake Companion: Infused Strikes',
    version: drakeCompanionSummon.version,
    rules: drakeCompanionSummon.rules,
    roll: [
        {pass: 'sceneOptionalBonusDamage', macro: infuse, priority: 50}
    ],
    config: {
        formula: {
            default: '1d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
