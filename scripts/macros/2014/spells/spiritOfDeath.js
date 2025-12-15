import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Reaper Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Reaper Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'spiritOfDeathMultiattack'});
    let reapingScytheFeatureData = await Summons.getSummonItem('Reaping Scythe (Reaper Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SpiritOfDeath.ReapingScythe', identifier: 'spiritOfDeathReapingScythe', flatAttack: true, damageBonus: spellLevel});
    let hauntCreatureFeatureData = await Summons.getSummonItem('Haunt Creature (Reaper Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SpiritOfDeath.HauntCreature', identifier: 'spiritOfDeathHauntCreature', flatDC: true});
    if (!multiAttackFeatureData || !reapingScytheFeatureData || !hauntCreatureFeatureData) {
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
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
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
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, reapingScytheFeatureData, hauntCreatureFeatureData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function attack({workflow}) {
    if (workflow.targets.size !== 1 || workflow.advantage) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritOfDeathHauntCreature');
    if (!effect) {
        workflow.aborted = true;
        genericUtils.notify('CHRISPREMADES.Macros.SpiritOfDeath.InvalidTarget', 'info');
        return;
    }
    let {targets: validTargetUuids} = effect.flags['chris-premades'].spiritOfDeathHauntCreature;
    if (!validTargetUuids.includes(workflow.targets.first().document.uuid)) {
        workflow.aborted = true;
        genericUtils.notify('CHRISPREMADES.Macros.SpiritOfDeath.InvalidTarget', 'info');
        return;
    }
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritOfDeathHauntCreature');
    if (effect) await genericUtils.remove(effect);
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.SpiritOfDeath.Haunted'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                showIcon : true,
                specialDuration: [
                    'zeroHP'
                ]
            }
        }
    };
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                spiritOfDeathHauntCreature: {
                    targets: Array.from(workflow.targets).map(i => i.document.uuid)
                }
            }
        }
    };
    effectUtils.addMacro(casterEffectData, 'combat', ['spiritOfDeathHauntCreatureHaunt']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'spiritOfDeathHauntCreature'});
    await Promise.all(workflow.targets.map(async target => {
        if (target.actor) await effectUtils.createEffect(target.actor, targetEffectData, {strictlyInterdependent: true, parentEntity: casterEffect, identifier: 'spiritOfDeathHauntCreatureHaunted'});
    }));
}
async function turnStart({trigger: {entity: effect, token, target}}) {
    let hauntedEffect = effectUtils.getEffectByIdentifier(target.actor, 'spiritOfDeathHauntCreatureHaunted');
    if (!hauntedEffect) return;
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'hauntCreatureSave', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [target]);
}
export let spiritOfDeath = {
    name: 'Spirit of Death',
    version: '1.1.1',
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
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ReaperSpirit',
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
};
export let spiritOfDeathHauntCreature = {
    name: 'Spirit of Death: Haunt Creature',
    version: spiritOfDeath.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['hauntCreatureHaunt']
            }
        ]
    }
};
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
};
