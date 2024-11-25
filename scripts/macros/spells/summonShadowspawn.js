import {Summons} from '../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Shadow Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflow.castData.castLevel;
    let creatureType;
    if (activityIdentifier === 'summonShadowspawnFury') {
        creatureType = 'fury';
    } else if (activityIdentifier === 'summonShadowspawnDespair') {
        creatureType = 'despair';
    } else if (activityIdentifier === 'summonShadowspawnFear') {
        creatureType = 'fear';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Shadow Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonShadowspawnMultiattack'});
    let chillingRendFeatureData = await Summons.getSummonItem('Chilling Rend', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonShadowspawn.ChillingRend', identifier: 'summonShadowspawnChillingRend', flatAttack: true, damageBonus: spellLevel});
    let dreadfulScreamFeatureData = await Summons.getSummonItem('Dreadful Scream', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonShadowspawn.DreadfulScream', identifier: 'summonShadowspawnDreadfulScream', flatDC: true});
    if (!multiAttackFeatureData || !chillingRendFeatureData || !dreadfulScreamFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.ShadowSpirit' + creatureType.capitalize());
    let hpFormula = 35 + ((spellLevel - 3) * 15);
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    ac: {
                        flat: 11 + spellLevel
                    },
                    hp: {
                        formula: hpFormula,
                        max: hpFormula,
                        value: hpFormula
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, chillingRendFeatureData, dreadfulScreamFeatureData]
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, creatureType + 'Avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, creatureType + 'Token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    if (creatureType === 'fury') {
        let terrorFrenzyData = await Summons.getSummonItem('Terror Frenzy (Fury Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonShadowspawn.TerrorFrenzy', identifier: 'summonShadowspawnTerrorFrenzy'});
        if (!terrorFrenzyData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(terrorFrenzyData);
    } else if (creatureType === 'fear') {
        let shadowStealthData = await Summons.getSummonItem('Shadow Stealth (Fear Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.ShadowStealth', identifier: 'summonShadowspawnShadowStealth'});
        if (!shadowStealthData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(shadowStealthData);
    } else {
        let weightOfSorrowData = await Summons.getSummonItem('Weight of Sorrow (Despair Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.WeightOfSorrow', identifier: 'summonShadowspawnWeightOfSorrow'});
        if (!weightOfSorrowData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(weightOfSorrowData);
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: 
            updates.actor.items
                .filter(i => !['summonShadowspawnTerrorFrenzy', 'summonShadowspawnWeightOfSorrow'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function turnStart({trigger: {entity: item, token, target}}) {
    let summonerActor = token.actor.flags['chris-premades'].summons.control.actor;
    if (target.actor.uuid === summonerActor) return;
    await workflowUtils.syntheticItemRoll(item, [target]);
}
export let summonShadowspawn = {
    name: 'Summon Shadowspawn',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'furyName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFury',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'fearName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFear',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'despairName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritDespair',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'furyToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFury',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fearToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFear',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'despairToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritDespair',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'furyAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFury',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fearAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritFear',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'despairAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ShadowSpiritDespair',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'furyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonShadowspawn.Fury',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fearAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonShadowspawn.Fear',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'despairAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonShadowspawn.Despair',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonShadowspawnDespair = {
    name: 'Summon Shadowspawn: Despair',
    version: summonShadowspawn.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            distance: 5,
            priority: 50
        }
    ]
};