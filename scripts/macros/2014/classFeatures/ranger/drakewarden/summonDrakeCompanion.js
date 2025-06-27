import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Drake Companion');
    if (!sourceActor) return;
    let classLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!classLevel) return;
    let drakeUpgrades = Math.floor((classLevel + 1) / 8);
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'summonDrakeCompanionDodge'});
    let biteData = await Summons.getSummonItem('Bite (Drake Companion)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Bite', identifier: 'summonDrakeCompanionBite'});
    let essenceData = await Summons.getSummonItem('Draconic Essence', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDrakeCompanion.Essence', identifier: 'summonDrakeCompanionDraconicEssence'});
    let strikesData = await Summons.getSummonItem('Infused Strikes', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonDrakeCompanion.InfusedStrikes', identifier: 'summonDrakeCompanionInfusedStrikes'});
    let itemsToAdd = [essenceData, strikesData, biteData, dodgeData];
    if (itemsToAdd.some(i => !i)) {
        errors.missingPackItem();
        return;
    }
    let commandFeature = activityUtils.getActivityByIdentifier(workflow.item, 'summonDrakeCompanionCommand', {strict: true});
    let resistanceFeature = activityUtils.getActivityByIdentifier(workflow.item, 'reflexiveResistance', {strict: true});
    if (!commandFeature || !resistanceFeature) return;
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonDrakeCompanion.Select', [
        ['DND5E.DamageAcid', 'acid'],
        ['DND5E.DamageCold', 'cold'],
        ['DND5E.DamageFire', 'fire'],
        ['DND5E.DamageLightning', 'lightning'],
        ['DND5E.DamagePoison', 'poison']
    ]);
    genericUtils.setProperty(strikesData, 'flags.chris-premades.infusedStrikes.damageType', damageType);
    let scale = 0.8;
    let heightWidth = 1;
    let biteActivityId = Object.keys(biteData.system.activities)[0];
    if (drakeUpgrades) {
        biteData.system.activities[biteActivityId].damage.parts.push({
            number: drakeUpgrades,
            denomination: 6,
            types: [damageType]
        });
        scale = 1;
        heightWidth = drakeUpgrades;
    }
    let hpValue = 5 + (classLevel * 5);
    let name = itemUtils.getConfig(workflow.item, damageType + 'Name');
    // Only did this weird add so we don't get a false positive for a missing translation
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.' + 'DrakeCompanion' + damageType.capitalize());
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
                        flat: 14 + workflow.actor.system.attributes.prof
                    }
                },
                traits: {
                    di: {
                        value: damageType
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition,
                height: heightWidth,
                width: heightWidth,
                texture: {
                    scaleX: scale,
                    scaleY: scale
                }
            },
            items: itemsToAdd
        },
        token: {
            name,
            disposition: workflow.token.document.disposition,
            height: heightWidth,
            width: heightWidth,
            texture: {
                scaleX: scale,
                scaleY: scale
            }
        }
    };
    switch (drakeUpgrades) {
        case 1:
            genericUtils.setProperty(updates, 'actor.system.attributes.movement.fly', genericUtils.handleMetric(40));
            genericUtils.setProperty(updates, 'actor.system.traits.size', 'med');
            break;
        case 2:
            genericUtils.setProperty(updates, 'actor.system.attributes.movement.fly', genericUtils.handleMetric(40));
            genericUtils.setProperty(updates, 'actor.system.traits.size', 'lg');
    }
    let avatarImg = itemUtils.getConfig(workflow.item, damageType + 'Avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, damageType + 'Token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, damageType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 30,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: itemsToAdd.slice(2).map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier})),
        additionalVaeButtons: [{
            type: 'use', 
            name: commandFeature.name,
            identifier: 'summonDrakeCompanion', 
            activityIdentifier: 'summonDrakeCompanionCommand'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['summonDrakeCompanionCommand'],
            favorite: true
        }
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonDrakeCompanion');
    if (!effect) return;
    if (drakeUpgrades) {
        let upgradeUpdates = {
            changes: [{
                key: 'system.traits.dr.value',
                mode: 2,
                priority: 20,
                value: damageType
            }]
        };
        if (drakeUpgrades > 1) {
            upgradeUpdates.flags = {
                'chris-premades': {
                    macros: {
                        midi: {
                            actor: ['summonDrakeCompanionResistance']
                        }
                    }
                }
            };
        }
        await genericUtils.update(effect, upgradeUpdates);
    }
}
async function postAttack({trigger: {entity: effect, token}, workflow}) {
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'reflexiveResistance', {strict: true});
    if (!feature) return;
    if (!feature.uses.value) return;
    if (!workflow.hitTargets.size) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let summonId = effect.flags['chris-premades'].summons.ids[effect.name][0];
    let summonToken = token.scene.tokens.get(summonId)?.object;
    if (!summonToken) return;
    let sourceHit = workflow.hitTargets.has(token);
    let summonHit = workflow.hitTargets.has(summonToken);
    if (!sourceHit && !summonHit) return;
    if (tokenUtils.getDistance(token, summonToken) > genericUtils.handleMetric(30)) return;
    let selection;
    if (sourceHit && summonHit) {
        selection = await dialogUtils.buttonDialog(feature.name, 'CHRISPREMADES.Macros.SummonDrakeCompanion.Resistance', [
            ['CHRISPREMADES.Macros.SummonDrakeCompanion.Self', 'self'],
            ['CHRISPREMADES.Macros.SummonDrakeCompanion.Summon', 'summon'],
            ['CHRISPREMADES.Generic.No', false]
        ]);
        if (!selection) return;
    } else if (sourceHit) {
        selection = await dialogUtils.confirm(feature.name, 'CHRISPREMADES.Macros.SummonDrakeCompanion.ResistanceSelf');
        if (!selection) return;
        selection = 'self';
    } else {
        selection = await dialogUtils.confirm(feature.name, 'CHRISPREMADES.Macros.SummonDrakeCompanion.Resistance');
        if (!selection) return;
        selection = 'summon';
    }
    let effectData = {
        name: feature.name,
        img: feature.img,
        origin: feature.item.uuid,
        changes: [
            {
                key: 'system.traits.dr.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isDamaged'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(selection === 'self' ? token.actor : summonToken.actor, effectData);
    await actorUtils.setReactionUsed(token.actor);
    await genericUtils.update(feature, {'uses.spent': feature.uses.spent + 1});
}
async function postDamage({trigger: {entity: item, token}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (workflow.token.document.disposition * token.document.disposition < 0) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let damageType = item.flags['chris-premades']?.infusedStrikes?.damageType;
    if (!damageType) return;
    if (tokenUtils.getDistance(token, workflow.token) > genericUtils.handleMetric(30)) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseName', {itemName: item.name, tokenName: token.name}), {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    await workflowUtils.bonusDamage(workflow, '1d6', {damageType});
    await actorUtils.setReactionUsed(token.actor);
}
export let summonDrakeCompanion = {
    name: 'Drake Companion: Summon',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summonDrakeCompanion']
            }
        ]
    },
    config: [
        {
            value: 'acidName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionAcid',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'coldName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionCold',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionFire',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'lightningName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionLightning',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'poisonName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionPoison',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'acidToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionAcid',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'coldToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionCold',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionFire',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'lightningToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionLightning',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'poisonToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionPoison',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'acidAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionAcid',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'coldAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionCold',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fireAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionFire',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'lightningAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionLightning',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'poisonAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionPoison',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'acidAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionAcid',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'coldAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionCold',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fireAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionFire',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'lightningAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionLightning',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'poisonAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DrakeCompanionPoison',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ],
    ddbi: {
        removedItems: {
            'Drake Companion: Summon': [
                'Bond of Fang and Scale: Acid Resistance',
                'Bond of Fang and Scale: Cold Resistance',
                'Bond of Fang and Scale: Fire Resistance',
                'Bond of Fang and Scale: Lightning Resistance',
                'Bond of Fang and Scale: Poison Resistance',
                'Drake Companion',
                'Drake Companion: Command',
                'Drake Companion: Drake Companion (Acid)',
                'Drake Companion: Drake Companion (Cold)',
                'Drake Companion: Drake Companion (Fire)',
                'Drake Companion: Drake Companion (Lightning)',
                'Drake Companion: Drake Companion (Poison)',
                'Reflexive Resistance'
            ]
        }
    }
};
export let summonDrakeCompanionResistance = {
    name: 'Drake Companion: Resistance',
    version: summonDrakeCompanion.version,
    midi: {
        actor: [
            {
                pass: 'sceneAttackRollComplete',
                macro: postAttack,
                priority: 50
            }
        ]
    }
};
export let summonDrakeCompanionInfuse = {
    name: 'Drake Companion: Infuse',
    version: summonDrakeCompanion.version,
    midi: {
        actor: [
            {
                pass: 'sceneDamageRollComplete',
                macro: postDamage,
                priority: 50
            }
        ]
    }
};