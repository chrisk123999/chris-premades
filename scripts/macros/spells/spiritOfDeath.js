
import {Summons} from '../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Bestial Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflow.castData.castLevel;
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Reaper Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'spiritOfDeathMultiattack'});
    let reapingScytheFeatureData = await Summons.getSummonItem('Reaping Scythe (Reaper Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SpiritOfDeath.ReapingScythe', identifier: 'spiritOfDeathReapingScythe', flatAttack: true, damageBonus: spellLevel});
    let hauntCreatureFeatureData = await Summons.getSummonItem('Haunt Creature (Reaper Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SpiritOfDeath.HauntCreature', identifier: 'spiritOfDeathHauntCreature'});
    if (!multiAttackFeatureData || !reapingScytheFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.ReaperSpirit');
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
                        walk: 30,
                        fly: 30,
                        hover: true
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, maulFeatureData]
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
    let hpFormula = 40 + (spellLevel - 4) * 10;
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
        additionalSummonVaeButtons: [multiAttackFeatureData, reapingScytheFeatureData, hauntCreatureFeatureData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
export let spiritOfDeath = {
    name: 'Spirit of Death',
    version: '0.12.10',
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
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ReaperSpirit',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ReaperSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ReaperSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            type: 'select',
            default: 'shadow',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
