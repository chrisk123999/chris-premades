import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Primal Companion');
    if (!sourceActor) return;
    let classLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!classLevel) return;
    let primalBondFeatureData = await Summons.getSummonItem('Primal Bond', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.PrimalCompanion.PrimalBond', identifier: 'primalCompanionPrimalBond'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'primalCompanionDodge'});
    if (!primalBondFeatureData || !dodgeData) {
        errors.missingPackItem();
        return;
    }
    let commandFeature = activityUtils.getActivityByIdentifier(workflow.item, 'primalCompanionCommand', {strict: true});
    if (!commandFeature) return;
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
                        flat: 13 + workflow.actor.system.attributes.prof
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [primalBondFeatureData, dodgeData]
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
        let chargeData = await Summons.getSummonItem('Charge', {}, workflow.item, {flatDC: true, translate: 'CHRISPREMADES.CommonFeatures.Charge', identifier: 'primalCompanionCharge'});
        let maulData = await Summons.getSummonItem('Maul', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Maul', identifier: 'primalCompanionMaul', flatAttack: true});
        if (!chargeData || !maulData) {
            errors.missingPackItem();
            return;
        }
        if (classLevel >= 7) {
            chargeData.system.properties.push('mgc');
            maulData.system.properties.push('mgc');
        }
        updates.actor.items.push(chargeData, maulData);
        genericUtils.setProperty(updates, 'actor.system.attributes.movement', {walk: genericUtils.convertDistance(40), climb: convertDistance(40)});
    } else if (creatureType === 'sea') {
        let amphibiousData = await Summons.getSummonItem('Amphibious', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Amphibious', identifier: 'primalCompanionAmphibious'});
        let bindingStrikeData = await Summons.getSummonItem('Binding Strike', {}, workflow.item, {flatAttack: true, flatDC: true, translate: 'CHRISPREMADES.Macros.PrimalCompanion.BindingStrike', identifier: 'primalCompanionBindingStrike'});
        if (!amphibiousData || !bindingStrikeData) {
            errors.missingPackItem();
            return;
        }
        if (classLevel >= 7) {
            bindingStrikeData.system.properties.push('mgc');
        }
        updates.actor.items.push(amphibiousData, bindingStrikeData);
        genericUtils.setProperty(updates, 'actor.system.attributes.movement', {walk: genericUtils.convertDistance(5), swim: genericUtils.convertDistance(60)});
    } else {
        hpValue = 4 + 4 * classLevel;
        let flybyData = await Summons.getSummonItem('Flyby', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Flyby', identifier: 'primalCompanionFlyby'});
        let shredData = await Summons.getSummonItem('Shred', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Shred', identifier: 'primalCompanionShred', flatAttack: true});
        if (!flybyData || !shredData) {
            errors.missingPackItem();
            return;
        }
        if (classLevel >= 7) {
            shredData.system.properties.push('mgc');
        }
        updates.actor.items.push(flybyData, shredData);
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
                            walk: genericUtils.convertDistance(10),
                            fly: genericUtils.convertDistance(60)
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
    let identifiersToVae = ['primalCompanionDodge', 'primalCompanionCharge', 'primalCompanionMaul', 'primalCompanionBindingStrike', 'primalCompanionShred'];
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: genericUtils.convertDistance(10),
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
async function earlySea({workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
        ['DND5E.DamagePiercing', 'piercing'],
        ['DND5E.DamageBludgeoning', 'bludgeoning']
    ]);
    if (!selection) selection = 'piercing';
    let activityData = activityUtils.withChangedDamage(workflow.activity, {}, [selection]);
    workflow.item = itemUtils.cloneItem(workflow.item, {
        ['system.activities.' + workflow.activity.id]: activityData
    });
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let primalCompanion = {
    name: 'Primal Companion',
    version: '1.1.0',
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
export let primalCompanionSea = {
    name: 'Primal Companion: Sea',
    version: primalCompanion.version,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: earlySea,
                priority: 50
            }
        ]
    }
};