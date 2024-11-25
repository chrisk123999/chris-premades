import {Summons} from '../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Undead Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflow.castData.castLevel;
    let creatureType;
    if (activityIdentifier === 'summonUndeadGhostly') {
        creatureType = 'ghostly';
    } else if (activityIdentifier === 'summonUndeadPutrid') {
        creatureType = 'putrid';
    } else if (activityIdentifier === 'summonUndeadSkeletal') {
        creatureType = 'skeletal';
    }
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Undead Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonUndeadMultiattack'});
    if (!multiAttackFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.UndeadSpirit' + creatureType.capitalize());
    let hpFormula = (spellLevel - 3) * 10;
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
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData]
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
    if (creatureType === 'ghostly') {
        hpFormula += 30;
        let incorporealPassageData = await Summons.getSummonItem('Incorporeal Passage (Ghostly Only)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonUndead.IncorporealPassage', identifier: 'summonUndeadIncorporealPassage'});
        let deathlyTouchData = await Summons.getSummonItem('Deathly Touch (Ghostly Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, flatDC: true, translate: 'CHRISPREMADES.Macros.SummonUndead.DeathlyTouch', identifier: 'summonUndeadDeathlyTouch'});
        if (!incorporealPassageData || !deathlyTouchData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        genericUtils.setProperty(updates, 'actor.system.attributes.movement', {fly: 40, hover: true});
        updates.actor.items.push(incorporealPassageData, deathlyTouchData);
    } else if (creatureType === 'skeletal') {
        hpFormula += 20;
        let graveBoltData = await Summons.getSummonItem('Grave Bolt (Skeletal Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.Macros.SummonUndead.GraveBolt', identifier: 'summonUndeadGraveBolt'});
        if (!graveBoltData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(graveBoltData);
    } else {
        hpFormula += 30;
        let festeringAuraData = await Summons.getSummonItem('Festering Aura (Putrid Only)', {}, workflow.item, {flatDC: true, translate: 'CHRISPREMADES.Macros.SummonUndead.FesteringAura', identifier: 'summonUndeadFesteringAura'});
        let rottingClawData = await Summons.getSummonItem('Rotting Claw (Putrid Only)', {}, workflow.item, {flatAttack: true, damageBonus: spellLevel, translate: 'CHRISPREMADES.Macros.SummonUndead.RottingClaw', identifier: 'summonUndeadRottingClaw'});
        let rottingClawParalyzeData = await Summons.getSummonItem('Rotting Claw (Putrid Only): Paralyze', {}, workflow.item, {flatDC: true, translate: 'CHRISPREMADES.Macros.SummonUndead.RottingClawParalyze', identifier: 'summonUndeadRottingClawParalyze'});
        if (!festeringAuraData || !rottingClawData || !rottingClawParalyzeData) {
            errors.missingPackItem();
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        updates.actor.items.push(festeringAuraData, rottingClawData, rottingClawParalyzeData);
    }
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
        additionalSummonVaeButtons: 
            updates.actor.items
                .filter(i => !['summonUndeadIncorporealPassage', 'summonUndeadFesteringAura', 'summonUndeadRottingClawParalyze'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function turnStart({trigger: {entity: item, token, target}}) {
    let summonerActor = token.actor.flags['chris-premades'].summons.control.actor;
    if (target.actor.uuid === summonerActor) return;
    await workflowUtils.syntheticItemRoll(item, [target]);
}
async function late({workflow}) {
    if (!workflow.hitTargets.size) return;
    let target = workflow.targets.first();
    if (!target.actor?.statuses?.has('poisoned')) return;
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'summonUndeadRottingClawParalyze');
    if (!item) return;
    await workflowUtils.syntheticItemRoll(item, [target]);
}
export let summonUndead = {
    name: 'Summon Undead',
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
            value: 'ghostlyName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritGhostly',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'skeletalName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritSkeletal',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'putridName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritPutrid',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'ghostlyToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritGhostly',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'skeletalToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritSkeletal',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'putridToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritPutrid',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'ghostlyAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritGhostly',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'skeletalAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritSkeletal',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'putridAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.UndeadSpiritPutrid',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'ghostlyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonUndead.Ghostly',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'skeletalAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonUndead.Skeletal',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'putridAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonUndead.Putrid',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let summonUndeadPutrid = {
    name: 'Summon Undead: Putrid',
    version: summonUndead.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            distance: 5,
            priority: 50
        }
    ]
};