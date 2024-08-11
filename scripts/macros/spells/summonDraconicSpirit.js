import {Summons} from '../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Draconic Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflow.castData.castLevel;
    let creatureButtons = [
        ['CHRISPREMADES.Macros.SummonDraconicSpirit.Chromatic', 'chromatic'],
        ['CHRISPREMADES.Macros.SummonDraconicSpirit.Metallic', 'metallic'],
        ['CHRISPREMADES.Macros.SummonDraconicSpirit.Gem', 'gem']
    ];
    let creatureType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonDraconicSpirit.Type', creatureButtons);
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Draconic Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonDraconicSpiritMultiattack'});
    let rendFeatureData = await Summons.getSummonItem('Rend (Draconic Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDraconicSpirit.Rend', identifier: 'summonDraconicSpiritRend', flatAttack: true, damageBonus: spellLevel});
    let breathWeaponData = await Summons.getSummonItem('Breath Weapon', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.BreathWeapon', identifier: 'summonDraconicSpiritBreathWeapon', flatDC: true});
    let sharedResistancesData = await Summons.getSummonItem('Shared Resistances', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDraconicSpirit.SharedResistances'});
    if (!multiAttackFeatureData || !rendFeatureData || !breathWeaponData || !sharedResistancesData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    effectUtils.addMacro(breathWeaponData, 'midi.item', ['summonDraconicSpiritBreathWeapon']);
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.DraconicSpirit' + creatureType.capitalize());
    let hpFormula = 50 + ((spellLevel - 5) * 10);
    let sharedOptions = [];
    if (creatureType === 'gem') {
        sharedOptions = [['DND5E.DamageForce', 'force'], ['DND5E.DamageNecrotic', 'necrotic'], ['DND5E.DamagePsychic', 'psychic'], ['DND5E.DamageRadiant', 'radiant'], ['DND5E.DamageThunder', 'thunder']];
    } else {
        sharedOptions = [['DND5E.DamageAcid', 'acid'], ['DND5E.DamageCold', 'cold'], ['DND5E.DamageFire', 'fire'], ['DND5E.DamageLightning', 'lightning'], ['DND5E.DamagePoison', 'poison']];
    }
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    ac: {
                        flat: 14 + spellLevel
                    },
                    hp: {
                        formula: hpFormula,
                        max: hpFormula,
                        value: hpFormula
                    }
                },
                traits: {
                    dr: {
                        value: sharedOptions.map(([_, i]) => i)
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, rendFeatureData, breathWeaponData, sharedResistancesData],
            flags: {
                'chris-premades': {
                    draconicSpirit: {
                        type: creatureType
                    }
                }
            }
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
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60,
        range: 60,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, rendFeatureData, breathWeaponData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonDraconicSpirit');
    if (!effect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let resistanceType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonDraconicSpirit.ResistanceType', sharedOptions);
    if (!resistanceType) return;
    let effectUpdates = {
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
                priority: 20,
                value: resistanceType
            }
        ]
    };
    await genericUtils.update(effect, effectUpdates);
}
async function damage({workflow}) {
    let dragonType = workflow.actor.flags['chris-premades']?.draconicSpirit?.type;
    if (!dragonType) return;
    let options;
    if (dragonType === 'gem') {
        options = [['DND5E.DamageForce', 'force'], ['DND5E.DamageNecrotic', 'necrotic'], ['DND5E.DamagePsychic', 'psychic'], ['DND5E.DamageRadiant', 'radiant'], ['DND5E.DamageThunder', 'thunder']];
    } else {
        options = [['DND5E.DamageAcid', 'acid'], ['DND5E.DamageCold', 'cold'], ['DND5E.DamageFire', 'fire'], ['DND5E.DamageLightning', 'lightning'], ['DND5E.DamagePoison', 'poison']];
    }
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonDraconicSpirit.DamageType', options);
    if (!damageType) return;
    let newRoll = await rollUtils.getChangedDamageRoll(workflow.damageRoll, damageType);
    await workflow.setDamageRoll(newRoll);
}
export let summonDraconicSpirit = {
    name: 'Summon Draconic Spirit',
    version: '0.12.11',
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
            value: 'chromaticName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritChromatic',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'metallicName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritMetallic',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'gemName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritGem',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'chromaticToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritChromatic',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'metallicToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritMetallic',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'gemToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritGem',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'chromaticAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritChromatic',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'metallicAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritMetallic',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'gemAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpiritGem',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'chromaticAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonDraconicSpirit.Chromatic',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'metallicAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonDraconicSpirit.Metallic',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'gemAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonDraconicSpirit.Gem',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonDraconicSpiritBreathWeapon = {
    name: 'Summon Draconic Spirit: Breath Weapon',
    version: summonDraconicSpirit.version,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};