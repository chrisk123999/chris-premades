import {Summons} from '../../../lib/summons.js';
import {actorUtils, itemUtils, effectUtils, genericUtils, compendiumUtils, constants, workflowUtils, errors, activityUtils} from '../../../utils.js';
async function use({workflow}){
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Aberrant Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let creatureType;
    if (activityIdentifier === 'summonAberrationBeholderkin') {
        creatureType = 'beholderkin';
    } else if (activityIdentifier === 'summonAberrationSlaad') {
        creatureType = 'slaad';
    } else if (activityIdentifier === 'summonAberrationStarSpawn') {
        creatureType = 'starSpawn';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Aberrant Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonAberrationMultiattack'});
    if (!multiAttackFeatureData) return;
    let hpFormula = 40 + ((workflowUtils.getCastLevel(workflow) - 4) * 10);
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.AberrantSpirit' + creatureType.capitalize());
    let updates = {
        actor: {
            name: name,
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
                name: name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData]
        },
        token: {
            name: name,
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
    if (creatureType === 'beholderkin') {
        let eyeRayData = await Summons.getSummonItem('Eye Ray (Beholderkin Only)', {}, workflow.item, ({translate: 'CHRISPREMADES.Macros.SummonAberration.EyeRay', identifier: 'summonAberrationEyeRay', flatAttack: true, damageBonus: spellLevel}));
        if (!eyeRayData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.system.attributes.movement = {
            fly: genericUtils.handleMetric(30),
            hover: true
        };
        updates.actor.items.push(eyeRayData);
    } else if (creatureType === 'slaad') {
        let clawsData = await Summons.getSummonItem('Claws (Slaad Only)', {}, workflow.item, ({translate: 'CHRISPREMADES.CommonFeatures.Claws', identifier: 'summonAberrationClaws', flatAttack: true, damageBonus: spellLevel}));
        let regenerationData = await Summons.getSummonItem('Regeneration (Slaad Only)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Regeneration', identifier: 'summonAberrationRegeneration'});
        if (!clawsData || !regenerationData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(clawsData, regenerationData);
    } else {
        let psychicSlamData = await Summons.getSummonItem('Psychic Slam (Star Spawn Only)', {}, workflow.item, ({translate: 'CHRISPREMADES.Macros.SummonAberration.PsychicSlam', identifier: 'summonAberrationPsychicSlam', flatAttack: true, damageBonus: spellLevel}));
        let whisperingAuraData = await Summons.getSummonItem('Whispering Aura (Star Spawn Only)', {}, workflow.item, ({translate: 'CHRISPREMADES.Macros.SummonAberration.WhisperingAura', identifier: 'summonAberrationWhisperingAura', flatDC: true}));
        if (!psychicSlamData || !whisperingAuraData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(psychicSlamData, whisperingAuraData);
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600, 
        range: 90, 
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons:
            updates.actor.items
                .filter(i => !['summonAberrationRegeneration', 'summonAberrationWhisperingAura'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function turnStart({trigger: {entity: item}}) {
    await workflowUtils.completeItemUse(item);
}
export let summonAberration = {
    name: 'Summon Aberration',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonAberrationBeholderkin', 'summonAberrationSlaad', 'summonAberrationStarSpawn']
            }
        ]
    },
    config: [
        {
            value: 'beholderkinName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'slaadName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'starSpawnName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'beholderkinToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'slaadToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'starSpawnToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'beholderkinAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'slaadAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'starSpawnAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'beholderAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'slaadAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'starSpawnAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonAberrationWhisperingAura = {
    name: 'Whispering Aura',
    version: summonAberration.version,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};