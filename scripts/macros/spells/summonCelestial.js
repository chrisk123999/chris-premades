import {Summons} from '../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Celestial Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    if (activityIdentifier === 'summonCelestialAvenger') {
        creatureType = 'avenger';
    } else if (activityIdentifier === 'summonCelestialDefender') {
        creatureType = 'defender';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Celestial Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonCelestialMultiattack'});
    let healingTouchFeatureData = await Summons.getSummonItem('Healing Touch (Celestial Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonCelestial.HealingTouch', identifier: 'summonCelestialHealingTouch', damageBonus: spellLevel});
    if (!multiAttackFeatureData || !healingTouchFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.CelestialSpirit' + creatureType.capitalize());
    let hpFormula = 40 + ((spellLevel - 5) * 10);
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpFormula,
                        max: hpFormula,
                        value: hpFormula
                    },
                    ac: {
                        flat: 11 + spellLevel + (creatureType === 'defender' ? 2 : 0)
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, healingTouchFeatureData]
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
    if (creatureType === 'avenger') {
        let radiantBowData = await Summons.getSummonItem('Radiant Bow (Avenger Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.Macros.SummonCelestial.RadiantBow', identifier: 'summonCelestialRadiantBow'});
        if (!radiantBowData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(radiantBowData);
    } else {
        let radiantMaceData = await Summons.getSummonItem('Radiant Mace (Defender Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.Macros.SummonCelestial.RadiantMace', identifier: 'summonCelestialRadiantMace'});
        if (!radiantMaceData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(radiantMaceData);
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: updates.actor.items.map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function late({workflow}) {
    if (!workflow.hitTargets.size) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'ally', {includeIncapacitated: true, includeToken: true});
    if (!nearbyTargets.length) return;
    let targetToken = nearbyTargets[0];
    if (nearbyTargets.length > 1) {
        let targetTokenMaybe = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonCelestial.Temp', nearbyTargets);
        if (!targetTokenMaybe?.length) return;
        [targetToken] = targetTokenMaybe;
    }
    let roll = await new CONFIG.Dice.DamageRoll('1d10[temphp]', {}, {type: 'temphp'}).evaluate();
    roll.toMessage({
        rollMode: 'roll',
        speaker: workflow.chatCard.speaker,
        flavor: workflow.item.name
    });
    await workflowUtils.applyDamage([targetToken], roll.total, 'temphp');
}
export let summonCelestial = {
    name: 'Summon Celestial',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonCelestialAvenger', 'summonCelestialDefender']
            }
        ]
    },
    config: [
        {
            value: 'avengerName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritAvenger',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'defenderName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritDefender',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'avengerToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritAvenger',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'defenderToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritDefender',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avengerAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritAvenger',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'defenderAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.CelestialSpiritDefender',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avengerAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonCelestial.Avenger',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'defenderAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonCelestial.Defender',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonCelestialMace = {
    name: 'Summon Celestial: Mace',
    version: summonCelestial.version,
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