import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const creatureTypes = {
    'find-steed-celestial': 'celestial',
    'find-steed-fey': 'fey',
    'find-steed-fiend': 'fiend'
};
const typeFeatures = {
    celestial: 'otherworldly-steed-healing-touch',
    fey: 'otherworldly-steed-fey-step',
    fiend: 'otherworldly-steed-fell-glare'
};
async function getFeature(identifier, {flatAttack, flatDC} = {}) {
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, identifier, {object: true, flatAttack, flatDC});
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.summons, 'otherworldlySteed');
    if (!sourceActor) {
        Logging.addMacroWarning('CPR', 'find-steed', 'CHRISPREMADES.Error.ActorNotFound', {notify: 'warn'});
        return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const items = await Promise.all([
        getFeature('otherworldly-steed-life-bond'),
        getFeature('otherworldly-steed-otherworldly-slam', {flatAttack: itemUtils.getSpellAttackBonus(document)}),
        getFeature(typeFeatures[creatureType], {flatDC: creatureType === 'fiend' ? itemUtils.getSaveDC(document) : undefined})
    ]);
    if (items.some(item => !item)) {
        Logging.addMacroWarning('CPR', 'find-steed', 'CHRISPREMADES.Error.MissingPackItem', {notify: 'warn'});
        return;
    }
    itemUtils.addDamageBonus(items[1], spellLevel);
    Object.values(items[1].system.activities).forEach(activity => activity.damage?.parts?.forEach(part => part.types = [automationUtils.getConfigValue(document, creatureType + 'DamageType')]));
    if (creatureType === 'celestial') Object.values(items[2].system.activities).forEach(activity => {
        if (activity.healing) activity.healing.bonus = activity.healing.bonus ? activity.healing.bonus + ' + ' + spellLevel : String(spellLevel);
    });
    const hp = automationUtils.getConfigValue(document, 'baseHitPoints') + spellLevel * automationUtils.getConfigValue(document, 'hitPointsPerLevel');
    const updates = {
        system: {
            details: {
                cr: actorUtils.getCR(workflow.actor),
                type: {value: creatureType}
            },
            attributes: {
                ac: {flat: automationUtils.getConfigValue(document, 'baseArmorClass') + spellLevel},
                hp: {formula: String(hp), max: hp, value: hp}
            }
        }
    };
    if (spellLevel >= automationUtils.getConfigValue(document, 'flyLevel')) genericUtils.setProperty(updates, 'system.attributes.movement.speeds.fly', automationUtils.getConfigValue(document, 'flySpeed'));
    genericUtils.setProperty(updates, 'flags.cat.automation.rules', '2024');
    await Promise.all(summonUtils.getSummonsBySource(document).map(existing => summonUtils.deleteSummon(existing)));
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || undefined,
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        initiative: 'follows',
        dismissAtZero: true,
        sourceDocument: document
    });
    if (!summon) return;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'findSteed',
        activityUuid: workflow.activity.uuid,
        macros: [
            {
                type: 'roll',
                macros: [
                    {
                        source: 'chris-premades',
                        rules: '2024',
                        identifier: 'find-steed-life-bond'
                    }
                ]
            }
        ]
    });
    const [effect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    if (effect) await documentUtils.makeDependent(summon.actor, [effect]);
    await summonUtils.placeSummons([summon], workflow.activity.range.value, {token: workflow.token.document});
}
async function lifeBond({document: effect, workflow, ditem, targetToken}) {
    if (workflow.item?.type !== 'spell' || !(workflowUtils.getCastLevel(workflow) > 0)) return;
    const healed = ditem.newHP - ditem.oldHP;
    if (!(healed > 0)) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return;
    const range = automationUtils.getConfigValue(item, 'lifeBondRange');
    const steedTokens = summonUtils.getSummonsBySource(item).map(steed => steed.token).filter(token => token?.parent === targetToken.parent && tokenUtils.getDistance(targetToken, token) <= range);
    if (!steedTokens.length) return;
    await workflowUtils.applyDamage(steedTokens, healed, 'healing');
}
async function feyStep({document, workflow}) {
    const steedToken = workflow.token?.document;
    if (!steedToken) return;
    const riders = steedToken.parent.tokens.filter(token => token.id !== steedToken.id && token.object && steedToken.object?.bounds.contains(token.object.center.x, token.object.center.y));
    const origin = {x: steedToken.x, y: steedToken.y};
    const riderOrigins = riders.map(rider => ({rider, x: rider.x, y: rider.y}));
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(steedToken, {range: workflow.activity.range.value, animation, options, requireSight: false});
    const offset = {x: steedToken.x - origin.x, y: steedToken.y - origin.y};
    if (!offset.x && !offset.y) return;
    await Promise.all(riderOrigins.map(({rider, x, y}) => tokenUtils.teleportToken(rider, {destination: {x: x + offset.x, y: y + offset.y}, animation, options})));
}
const summonConfig = (creatureType, damageType, animation) => ({
    [creatureType + 'DamageType']: {default: damageType, type: 'select', label: 'CHRISPREMADES.Macros.Modern.FindSteed.' + creatureType.capitalize() + 'DamageType', category: 'homebrew', get options() { return constants.damageTypeOptions; }},
    [creatureType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
    [creatureType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
    [creatureType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
    [creatureType + 'Animation']: {default: {source: 'chris-premades', identifier: animation}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
});
export const findSteed = {
    name: 'Find Steed',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        baseHitPoints: {default: 5, type: 'number', label: 'CHRISPREMADES.Config.HitPoints', category: 'homebrew'},
        hitPointsPerLevel: {default: 10, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.HitPointsPerLevel', category: 'homebrew'},
        baseArmorClass: {default: 10, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.BaseArmorClass', hint: 'CHRISPREMADES.Macros.Modern.FindSteed.BaseArmorClassHint', category: 'homebrew'},
        flyLevel: {default: 4, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.FlyLevel', hint: 'CHRISPREMADES.Macros.Modern.FindSteed.FlyLevelHint', category: 'homebrew'},
        flySpeed: {default: 60, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.FlySpeed', category: 'homebrew'},
        lifeBondRange: {default: 5, type: 'number', label: 'CHRISPREMADES.Macros.Modern.FindSteed.LifeBondRange', category: 'homebrew'},
        ...summonConfig('celestial', 'radiant', 'celestialSummon'),
        ...summonConfig('fey', 'psychic', 'natureSummon'),
        ...summonConfig('fiend', 'necrotic', 'fiendSummon')
    }
};
export const findSteedLifeBond = {
    name: 'Find Steed: Life Bond',
    version: findSteed.version,
    rules: findSteed.rules,
    roll: [
        {pass: 'targetDamageComplete', macro: lifeBond, priority: 250}
    ]
};
export const otherworldlySteedFeyStep = {
    name: 'Otherworldly Steed: Fey Step',
    version: findSteed.version,
    rules: findSteed.rules,
    roll: [
        {pass: 'itemRollFinished', macro: feyStep, priority: 50}
    ],
    config: {
        animation: {default: {source: 'chris-premades', identifier: 'mistyStep'}, type: 'selectAnimation', inputs: ['token', 'options'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
    }
};
