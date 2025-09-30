import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Primal Companion');
    if (!sourceActor) return;
    let classLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!classLevel) return;
    let primalBondFeatureData = await Summons.getSummonItem('Primal Bond', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.PrimalCompanion.PrimalBond', identifier: 'primalCompanionPrimalBond'});
    let dashData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dash', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dash', identifier: 'primalCompanionDash'});
    let disengageData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Disengage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Disengage', identifier: 'primalCompanionDisengage'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'primalCompanionDodge'});
    let helpData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Help', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Help', identifier: 'primalCompanionHelp'});
    if (!primalBondFeatureData || !dashData || !disengageData || !dodgeData || !helpData) {
        errors.missingPackItem();
        return;
    }
    let itemsToAdd = [primalBondFeatureData];
    let commandFeature = activityUtils.getActivityByIdentifier(workflow.item, 'primalCompanionCommand', {strict: true});
    if (!commandFeature) return;
    let exceptionalTraining = itemUtils.getItemByIdentifier(workflow.actor, 'exceptionalTraining');
    if (exceptionalTraining) {
        let genericActions = [dashData, disengageData, dodgeData, helpData];
        genericActions.forEach(i => {
            let genericActivity = Object.entries(i.system.activities)[0][1]
            genericActivity.activation.type = 'bonus';
            itemsToAdd.push(i);
        })
    }
    else {
        itemsToAdd.push(dodgeData);
    }
    let creatureType = activityIdentifier.slice(15).toLowerCase();
    let hpValue = 5 + (classLevel * 5);
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    // Only did this weird add so we don't get a false positive for a missing translation
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.' + 'BeastOfThe' + creatureType.capitalize());
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpValue,
                        max: hpValue,
                        value: hpValue
                    },
                    ac: {
                        flat: 13 + workflow.actor.system.abilities.wis.mod
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: itemsToAdd
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
    if (creatureType === 'land') {
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
            ['DND5E.DamageBludgeoning', 'bludgeoning'],
            ['DND5E.DamagePiercing', 'piercing'],
            ['DND5E.DamageSlashing', 'slashing']
        ]);
        if (!selection) selection = 'slashing';
        let types = [selection];
        if (exceptionalTraining) {
            types.push('force');
        }
        let beastsStrikeData = await Summons.getSummonItem('Beast\'s Strike (Land)', {}, workflow.item, {flatAttack: true, translate: 'CHRISPREMADES.Macros.PrimalCompanion.BeastsStrike', identifier: 'primalCompanionLandBeastsStrike', rules: 'modern'});
        if (!beastsStrikeData) {
            errors.missingPackItem();
            return;
        }
        let attackActivity = Object.entries(beastsStrikeData.system.activities).map(a => a[1]).find(a => a.type === 'attack');
        attackActivity.damage.parts[0].types = new Set(types);
        updates.actor.items.push(beastsStrikeData);
        genericUtils.setProperty(updates, 'actor.system.attributes.movement', {walk: 40, climb: 40});
    } else if (creatureType === 'sea') {
        let amphibiousData = await Summons.getSummonItem('Amphibious', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Amphibious', identifier: 'primalCompanionAmphibious', rules: 'modern'});
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
            ['DND5E.DamageBludgeoning', 'bludgeoning'],
            ['DND5E.DamagePiercing', 'piercing'],
        ]);
        if (!selection) selection = 'bludgeoning';
        let types = [selection];
        if (exceptionalTraining) {
            types.push('force');
        }
        let beastsStrikeData = await Summons.getSummonItem('Beast\'s Strike (Sea)', {}, workflow.item, {flatAttack: true, translate: 'CHRISPREMADES.Macros.PrimalCompanion.BeastsStrike', identifier: 'primalCompanionSeaBeastsStrike', rules: 'modern'});
        if (!amphibiousData || !beastsStrikeData) {
            errors.missingPackItem();
            return;
        }
        let attackActivity = Object.entries(beastsStrikeData.system.activities).map(a => a[1]).find(a => a.type === 'attack');
        attackActivity.damage.parts[0].types = new Set(types);
        beastsStrikeData.flags['chris-premades'].config.generic.autoGrapple.dc = workflow.actor.system.attributes.spell.dc;
        updates.actor.items.push(amphibiousData, beastsStrikeData);
        genericUtils.setProperty(updates, 'actor.system.attributes.movement', {walk: 5, swim: 60});
    } else {
        hpValue = 4 + 4 * classLevel;
        let beastsStrikeData = await Summons.getSummonItem('Beast\s Strike (Sky)', {}, workflow.item, {flatAttack: true, translate: 'CHRISPREMADES.Macros.PrimalCompanion.BeastsStrike', identifier: 'primalCompanionSkyBeastsStrike', rules: 'modern'});
        if (!flybyData || !beastsStrikeData) {
            errors.missingPackItem();
            return;
        }
        let types = ['slashing'];
        if (exceptionalTraining) {
            types.push('force');
        }
        let attackActivity = Object.entries(beastsStrikeData.system.activities).map(a => a[1]).find(a => a.type === 'attack');
        attackActivity.damage.parts[0].types = new Set(types);
        let flybyData = await Summons.getSummonItem('Flyby', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Flyby', identifier: 'primalCompanionFlyby', rules: 'modern'});
        updates.actor.items.push(beastsStrikeData, flybyData);
        genericUtils.mergeObject(updates, {
            actor: {
                system: {
                    abilities: {
                        str: {
                            value: 6
                        },
                        dex: {
                            value: 16
                        },
                        con: {
                            value: 13
                        }
                    },
                    attributes: {
                        hp: {
                            formula: hpValue,
                            max: hpValue,
                            value: hpValue
                        },
                        movement: {
                            walk: 10,
                            fly: 60
                        }
                    },
                    traits: {
                        size: 'sm'
                    }
                },
                prototypeToken: {
                    texture: {
                        scaleX: 0.8,
                        scaleY: 0.8
                    }
                }
            },
            token: {
                texture: {
                    scaleX: 0.8,
                    scaleY: 0.8
                }
            }
        });
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    let identifiersToVae = ['primalCompanionDodge', 'primalCompanionBeastsStrikeLand', 'primalCompanionBeastsStrikeSea', 'primalCompanionBeastsStrikeSky'];
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 10,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: 
            updates.actor.items
                .filter(i => identifiersToVae.includes(i.flags['chris-premades'].info.identifier))
                .map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier})),
        additionalVaeButtons: [{
            type: 'use', 
            name: commandFeature.name,
            identifier: 'primalCompanion',
            activityIdentifier: 'primalCompanionCommand'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['primalCompanionCommand'],
            favorite: true
        }
    });
}
async function damage({workflow}) {
    let ownerActor = await fromUuid(workflow.actor.flags['chris-premades'].summons.control.actor);
    let bestialFury = itemUtils.getItemByIdentifier(ownerActor, 'bestialFury');
    if (!bestialFury) return;
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let effect = effectUtils.getEffectByIdentifier(ownerActor, 'huntersMark');
    if (!effect) return;
    let {targets: validTargetUuids, formula, damageType} = effect.flags['chris-premades'].huntersMark;
    if (!validTargetUuids.includes(workflow.hitTargets.first().document.uuid)) return;
    let item = workflow.item;
    if (!combatUtils.perTurnCheck(item, 'bestialFury', false, workflow.token.id)) return;
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    await combatUtils.setTurnCheck(item, 'bestialFury');
}
export let primalCompanion = {
    name: 'Primal Companion',
    version: '1.3.79',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['primalCompanionLand', 'primalCompanionSea', 'primalCompanionSky']
            }
        ]
    },
    config: [
        {
            value: 'landName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheLand',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'seaName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSea',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'skyName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSky',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'landToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheLand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'seaToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSea',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'skyToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSky',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'landAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheLand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'seaAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSea',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'skyAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSky',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'landAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheLand',
            type: 'select',
            default: 'earth',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'seaAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSea',
            type: 'select',
            default: 'water',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'skyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.BeastOfTheSky',
            type: 'select',
            default: 'air',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let bestialFury = {
    name: 'Bestial Fury',
    version: primalCompanion.version,
    rules: primalCompanion.rules,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};