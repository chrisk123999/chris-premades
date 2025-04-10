import {Summons} from '../../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Draconic Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Draconic Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonDragonMultiattack', rules: 'modern'});
    let rendFeatureData = await Summons.getSummonItem('Rend (Draconic Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDragon.Rend', identifier: 'summonDragonRend', flatAttack: true, damageBonus: spellLevel, rules: 'modern'});
    let breathWeaponData = await Summons.getSummonItem('Breath Weapon', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.BreathWeapon', identifier: 'summonDragonBreathWeapon', flatDC: true, rules: 'modern'});
    let sharedResistancesData = await Summons.getSummonItem('Shared Resistances', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDragon.SharedResistances', rules: 'modern'});
    if (!multiAttackFeatureData || !rendFeatureData || !breathWeaponData || !sharedResistancesData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let sharedOptions = [['DND5E.DamageAcid', 'acid'], ['DND5E.DamageCold', 'cold'], ['DND5E.DamageFire', 'fire'], ['DND5E.DamageLightning', 'lightning'], ['DND5E.DamagePoison', 'poison']];
    let resistanceType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonDragon.ResistanceType', sharedOptions);
    if (!resistanceType) return;
    let breathWeaponSaveId = Object.keys(breathWeaponData.system.activities)[0];
    let breathWeaponSaveActivity = breathWeaponData.system.activities[breathWeaponSaveId];
    breathWeaponSaveActivity.damage.parts[0].types = [resistanceType];
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.DraconicSpirit');
    let hpFormula = 50 + ((spellLevel - 5) * 10);
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
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, rendFeatureData, breathWeaponData, sharedResistancesData]
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 60,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, rendFeatureData, breathWeaponData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonDragon');
    if (!effect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectUpdates = {
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                priority: 20,
                value: resistanceType
            }
        ]
    };
    await genericUtils.update(effect, effectUpdates);
}
export let summonDragon = {
    name: 'Summon Dragon',
    version: '1.2.32',
    rules: 'modern',
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
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpirit',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DraconicSpirit',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};