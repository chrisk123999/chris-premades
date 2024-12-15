
import {Summons} from '../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Reaper Spirit');
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
            items: [multiAttackFeatureData, reapingScytheFeatureData, hauntCreatureFeatureData]
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
async function attack({workflow}) {
    if (workflow.targets.size !== 1 || workflow.disadvantage) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritOfDeathHauntCreature');
    let {targets: validTargetUuids, formula} = effect.flags['chris-premades'].spiritOfDeathHauntCreature;
    if (!validTargetUuids.includes(workflow.targets.first().document.uuid)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonedEffect');
    let originItem = fromUuidSync(effect?.origin);
    let sourceActor = originItem?.actor;
    if(!sourceActor)
    {
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.summonFeatures, 'Haunt Creature: Haunt', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SpiritOfDeath.HauntCreatureHaunt', identifier: 'spiritOfDeathHauntCreatureHaunt', flatDC: sourceActor.sytem.attributes.spelldc});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.SpiritOfDeath.Haunted'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                "specialDuration": [
                    "zeroHP"
                ]
            }
        }
    };
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        },
        flags: {
            'chris-premades': {
                spiritOfDeathHauntCreature: {
                    targets: Array.from(workflow.targets).map(i => i.document.uuid),
                }
            }
        }
    };
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'spiritOfDeathHauntCreatureHaunt'});
    await genericUtils.setFlag(casterEffect, 'chris-premades', 'macros.combat', ['spiritOfDeathHauntCreatureHaunt']);
    for (let i of workflow.targets) {
        if (i.actor) await effectUtils.createEffect(i.actor, targetEffectData, {parentEntity: casterEffect, identifier: 'spiritOfDeathHauntCreatureHaunted'});
    }
    await itemUtils.createItems(workflow.actor, [featureData], {parentEntity: casterEffect});
}
async function turnStart({trigger: {entity: effect, token, target}}) {
    if (combatUtils.inCombat()) {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) return;
        let effect = effectUtils.getEffectByIdentifier(targetCombatant, 'spiritOfDeathHauntCreatureHaunted');
        if (!effect) return;
        let feature = itemUtils.getItemByIdentifier(token.actor, 'spiritOfDeathHauntCreatureHaunt');
        if (!feature) return;
        let saveWorkflow = await workflowUtils.syntheticItemRoll(feature, [target]);
    }
}
export let spiritOfDeath = {
    name: 'Spirit of Death',
    version: '',
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
export let spiritOfDeathReapingScythe = {
    name: 'Spirit of Death: Reaping Scythe',
    version: spiritOfDeath.version,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
}
export let spiritOfDeathHauntCreature = {
    name: 'Spirit of Death: Haunt Creature',
    version: spiritOfDeath.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
}
export let spiritOfDeathHauntCreatureHaunt = {
    name: 'Haunt Creature: Haunt',
    version: spiritOfDeath.version,
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            distance: 10,
            priority: 50
        }
    ]
}
