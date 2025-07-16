import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Elemental Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    let slamDamageType;
    if (activityIdentifier === 'summonElementalAir') {
        creatureType = 'air';
        slamDamageType = 'lightning';
    } else if (activityIdentifier === 'summonElementalEarth') {
        creatureType = 'earth';
        slamDamageType = 'bludgeoning';
    } else if (activityIdentifier === 'summonElementalFire') {
        creatureType = 'fire';
        slamDamageType = 'fire';
    } else if (activityIdentifier === 'summonElementalWater') {
        creatureType = 'water';
        slamDamageType = 'acid';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Elemental Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonElementalMultiattack', rules: 'modern'});
    let slamFeatureData = await Summons.getSummonItem('Slam (Elemental Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonElemental.Slam', identifier: 'summonElementalSlam', flatAttack: true, damageBonus: spellLevel, rules: 'modern'});
    if (!multiAttackFeatureData || !slamFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let slamAttackId = Object.keys(slamFeatureData.system.activities)[0];
    let slamAttackActivity = slamFeatureData.system.activities[slamAttackId];
    slamAttackActivity.damage.parts[0].types = [slamDamageType];
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.ElementalSpirit' + creatureType.capitalize());
    let hpFormula = 50 + ((spellLevel - 4) * 10);
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
            items: [multiAttackFeatureData, slamFeatureData]
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
    if (creatureType === 'earth') {
        genericUtils.setProperty(updates, 'actor.system.attributes.movement.burrow', genericUtils.handleMetric(40));
        genericUtils.setProperty(updates, 'actor.system.traits.dr.value', ['piercing', 'slashing']);
    } else {
        let amorphousFormData = await Summons.getSummonItem('Amorphous Form (Air, Fire, and Water Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonElemental.AmorphousForm'});
        if (!amorphousFormData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(amorphousFormData);
        if (creatureType === 'air') {
            genericUtils.setProperty(updates, 'actor.system.attributes.movement', {fly: genericUtils.handleMetric(40), hover: true});
            genericUtils.setProperty(updates, 'actor.system.traits.dr.value', ['lightning', 'thunder']);
        } else if (creatureType === 'water') {
            genericUtils.setProperty(updates, 'actor.system.attributes.movement.swim', genericUtils.handleMetric(40));
            genericUtils.setProperty(updates, 'actor.system.traits.dr.value', 'acid');
        } else {
            genericUtils.setProperty(updates, 'actor.system.traits.di.value', 'fire');
        }
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, slamFeatureData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
export let summonElemental = {
    name: 'Summon Elemental',
    version: '1.2.32',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonElementalAir', 'summonElementalEarth', 'summonElementalFire', 'summonElementalWater']
            }
        ]
    },
    config: [
        {
            value: 'airName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritAir',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'earthName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritEarth',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritFire',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritWater',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'airToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritAir',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'earthToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritEarth',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritFire',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritWater',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'airAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritAir',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'earthAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritEarth',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritFire',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'waterAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ElementalSpiritWater',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'airAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonElemental.Air',
            type: 'select',
            default: 'air',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'earthAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonElemental.Earth',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fireAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonElemental.Fire',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'waterAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonElemental.Water',
            type: 'select',
            default: 'water',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};