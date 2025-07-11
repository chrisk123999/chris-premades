import {Summons} from '../../../lib/summons.js';
import {Teleport} from '../../../lib/teleport.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Fiendish Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    if (activityIdentifier === 'summonFiendDemon') {
        creatureType = 'demon';
    } else if (activityIdentifier === 'summonFiendDevil') {
        creatureType = 'devil';
    } else if (activityIdentifier === 'summonFiendYugoloth') {
        creatureType = 'yugoloth';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Fiendish Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonFiendMultiattack', rules: 'modern'});
    let magicResistanceFeatureData = await Summons.getSummonItem('Magic Resistance (Fiendish Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.MagicResistance', identifier: 'magicResistance', rules: 'modern'});
    if (!multiAttackFeatureData || !magicResistanceFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.FiendishSpirit' + creatureType.capitalize());
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    ac: {
                        flat: 12 + spellLevel
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, magicResistanceFeatureData]
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
    let hpFormula = (spellLevel - 6) * 15;
    if (creatureType === 'demon') {
        hpFormula += 50;
        let deathThroesData = await Summons.getSummonItem('Death Throes (Demon Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonFiend.DeathThroes', identifier: 'summonFiendDeathThroes', flatDC: true, damageBonus: spellLevel, rules: 'modern'});
        let biteData = await Summons.getSummonItem('Bite (Demon Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Bite', identifier: 'summonFiendBite', flatAttack: true, damageBonus: spellLevel, rules: 'modern'});
        if (!deathThroesData || !biteData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        genericUtils.setProperty(updates, 'actor.system.attributes.movement.climb', genericUtils.handleMetric(40));
        updates.actor.items.push(biteData, deathThroesData);
    } else if (creatureType === 'devil') {
        hpFormula += 40;
        let fieryStrikeData = await Summons.getSummonItem('Fiery Strike (Devil Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.Macros.SummonFiend.FieryStrike', identifier: 'summonFiendFieryStrike', rules: 'modern'});
        let devilsSightData = await Summons.getSummonItem('Devil\'s Sight (Devil Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.DevilsSight', identifier: 'devilsSight', rules: 'modern'});
        if (!fieryStrikeData || !devilsSightData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        genericUtils.setProperty(updates, 'actor.system.attributes.movement.fly', genericUtils.handleMetric(60));
        updates.actor.items.push(fieryStrikeData, devilsSightData);
    } else {
        hpFormula += 60;
        let clawsData = await Summons.getSummonItem('Claws (Yugoloth Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.CommonFeatures.Claws', identifier: 'summonFiendClaws', rules: 'modern'});
        if (!clawsData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(clawsData);
    }
    updates.actor.system.attributes.hp = {
        formula: hpFormula,
        max: hpFormula,
        value: hpFormula
    };
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: 
            updates.actor.items
                .filter(i => !['magicResistance', 'summonFiendDeathThroes', 'devilsSight'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
    if (creatureType !== 'demon') return;
    if (!spawnedTokens?.length) return;
    let [spawnedToken] = spawnedTokens;
    let summonEffect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonFiend');
    if (!summonEffect) return;
    if (!effect) return;
    await genericUtils.update(summonEffect, {'flags.chris-premades.macros.effect': ['summonFiendDeathThroes']});
    await genericUtils.update(effect, {'flags.chris-premades.macros.effect': ['summonFiendDeathThroes']});
}
async function remove({trigger}) {
    let effect = trigger.entity;
    let item = itemUtils.getItemByIdentifier(effect.parent, 'summonFiendDeathThroes');
    if (!item) {
        // Parent effect. Wait until blown up, then dismiss
        let summonFlags = effect.flags['chris-premades'].summons;
        let tokenId = summonFlags.ids[effect.name][0];
        let sceneId = summonFlags.scenes[effect.name][0];
        let summonToken = game.scenes.get(sceneId)?.tokens.get(tokenId);
        if (!summonToken) {
            await Summons.dismiss({trigger});
            return;
        }
        let timePassed = 0;
        while (!summonToken.flags['chris-premades']?.summonFiend?.deathThroesComplete && timePassed < 5000) {
            timePassed += 100;
            await genericUtils.sleep(100);
        }
        await Summons.dismiss({trigger});
        return;
    }
    let token = effect.parent.token;
    if (token) {
        let nearbyTargets = tokenUtils.findNearby(token, 10, undefined, {includeIncapacitated: true});
        if (nearbyTargets.length) await workflowUtils.syntheticItemRoll(item, nearbyTargets, {options: {workflowOptions: {allowIncapacitated: true}}});
    }
    // Mark on token effect that we already blew up so when it gets to this function it actually dismisses
    await genericUtils.update(token, {'flags.chris-premades.summonFiend.deathThroesComplete': true});
    await Summons.dismiss({trigger});
}
async function late({workflow}) {
    let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.SummonFiend.UseTeleportation');
    if (!selection) return;
    await Teleport.target([workflow.token], workflow.token, {range: 30, animation: 'mistyStep'});
}
export let summonFiend = {
    name: 'Summon Fiend',
    version: '1.2.32',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonFiendDemon', 'summonFiendDevil', 'summonFiendYugoloth']
            }
        ]
    },
    config: [
        {
            value: 'demonName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDemon',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'devilName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDevil',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'yugolothName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritYugoloth',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'demonToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDemon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'devilToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDevil',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'yugolothToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritYugoloth',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'demonAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDemon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'devilAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritDevil',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'yugolothAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FiendishSpiritYugoloth',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'demonAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFiend.Demon',
            type: 'select',
            default: 'fiend',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'devilAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFiend.Devil',
            type: 'select',
            default: 'fiend',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'yugolothAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFiend.Yugoloth',
            type: 'select',
            default: 'fiend',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonFiendDeathThroes = {
    name: 'Summon Fiend: Death Throes',
    version: summonFiend.version,
    rules: summonFiend.rules,
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 25
        }
    ]
};
export let summonFiendClaws = {
    name: 'Summon Fiend: Claws',
    version: summonFiend.version,
    rules: summonFiend.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};