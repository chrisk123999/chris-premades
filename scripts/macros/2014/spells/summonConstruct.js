import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Construct Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    if (activityIdentifier === 'summonConstructClay') {
        creatureType = 'clay';
    } else if (activityIdentifier === 'summonConstructMetal') {
        creatureType = 'metal';
    } else if (activityIdentifier === 'summonConstructStone') {
        creatureType = 'stone';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Construct Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonConstructMultiattack'});
    let slamFeatureData = await Summons.getSummonItem('Slam (Construct Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonConstruct.Slam', identifier: 'summonConstructSlam', flatAttack: true, damageBonus: spellLevel});
    if (!multiAttackFeatureData || !slamFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.ConstructSpirit' + creatureType.capitalize());
    let hpFormula = 40 + ((spellLevel - 4) * 15);
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    ac: {
                        flat: 13 + spellLevel
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
    if (creatureType === 'clay') {
        let berserkLashingData = await Summons.getSummonItem('Berserk Lashing (Clay Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonConstruct.BerserkLashing', identifier: 'summonConstructBerserkLashing'});
        if (!berserkLashingData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(berserkLashingData);
    } else if (creatureType === 'metal') {
        let heatedBodyData = await Summons.getSummonItem('Heated Body (Metal Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.HeatedBody', identifier: 'summonConstructHeatedBody'});
        if (!heatedBodyData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(heatedBodyData);
    } else {
        let stoneLethargyData = await Summons.getSummonItem('Stone Lethargy (Stone Only)', {}, workflow.item, {flatDC: true, translate: 'CHRISPREMADES.CommonFeatures.StoneLethargy', identifier: 'summonConstructStoneLethargy'});
        if (!stoneLethargyData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(stoneLethargyData);
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
async function turnStart({trigger: {entity: item, token, target}}) {
    if (!tokenUtils.canSee(token, target)) return;
    let attackWorkflow = await workflowUtils.syntheticItemRoll(item, [target]);
    if (!attackWorkflow.failedSaves.size) return;
    actorUtils.setReactionUsed(target.actor);
}
export let summonConstruct = {
    name: 'Summon Construct',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonConstructClay', 'summonConstructMetal', 'summonConstructStone']
            }
        ]
    },
    config: [
        {
            value: 'clayName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritClay',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'metalName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritMetal',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'stoneName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritStone',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'clayToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritClay',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'metalToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritMetal',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'stoneToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritStone',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'clayAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritClay',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'metalAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritMetal',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'stoneAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ConstructSpiritStone',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'clayAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonConstruct.Clay',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'metalAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonConstruct.Metal',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'stoneAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonConstruct.Stone',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
export let summonConstructStone = {
    name: 'Summon Construct: Stone',
    version: summonConstruct.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            distance: 10,
            disposition: 'enemy',
            priority: 50
        }
    ]
};