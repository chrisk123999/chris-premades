import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Bestial Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    if (activityIdentifier === 'summonBeastAir') {
        creatureType = 'air';
    } else if (activityIdentifier === 'summonBeastLand') {
        creatureType = 'land';
    } else if (activityIdentifier === 'summonBeastWater') {
        creatureType = 'water';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Bestial Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonBeastMultiattack', rules: 'modern'});
    let rendFeatureData = await Summons.getSummonItem('Rend (Bestial Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonBeast.Rend', identifier: 'summonBeastRend', flatAttack: true, damageBonus: spellLevel, rules: 'modern'});
    if (!multiAttackFeatureData || !rendFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.BestialSpirit' + creatureType.capitalize());
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
                    movement: {
                        walk: genericUtils.handleMetric(30)
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, rendFeatureData]
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
    let hpFormula = 20;
    if (creatureType === 'air') {
        let flybyData = await Summons.getSummonItem('Flyby (Air Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonBeast.Flyby', identifier: 'summonBeastFlyby', rules: 'modern'});
        if (!flybyData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(flybyData);
        updates.actor.system.attributes.movement.fly = genericUtils.handleMetric(60);
    } else {
        let packTacticsData = await Summons.getSummonItem('Pack Tactics (Land and Water Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.PackTactics', identifier: 'summonBeastPackTactics', rules: 'modern'});
        if (!packTacticsData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(packTacticsData);
        hpFormula += 10;
        if (creatureType === 'land') {
            updates.actor.system.attributes.movement.climb = genericUtils.handleMetric(30);
        } else {
            updates.actor.system.attributes.movement.swim = genericUtils.handleMetric(30);
            let waterBreathingData = await Summons.getSummonItem('Water Breathing (Water Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.WaterBreathing', identifier: 'summonBeastWaterBreathing', rules: 'modern'});
            if (!waterBreathingData) {
                errors.missingPackItem();
                if (concentrationEffect) await genericUtils.remove(concentrationEffect);
                return;
            }
            updates.actor.items.push(waterBreathingData);
        }
    }
    hpFormula += (spellLevel - 2) * 5;
    updates.actor.system.attributes.hp = {
        formula: hpFormula,
        max: hpFormula,
        value: hpFormula
    };
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, rendFeatureData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
export let summonBeast = {
    name: 'Summon Beast',
    version: '1.2.32',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonBeastAir', 'summonBeastLand', 'summonBeastWater']
            }
        ]
    },
    config: [
        {
            value: 'airName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritAir',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'landName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritLand',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritWater',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'airToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritAir',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'landToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritLand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritWater',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'airAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritAir',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'landAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritLand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BestialSpiritWater',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'airAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonBeast.Air',
            type: 'select',
            default: 'air',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'landAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonBeast.Land',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'waterAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonBeast.Water',
            type: 'select',
            default: 'water',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};