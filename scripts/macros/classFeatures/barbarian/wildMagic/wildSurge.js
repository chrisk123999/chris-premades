import {Summons} from '../../../../lib/summons.js';
import {Teleport} from '../../../../lib/teleport.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, templateUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let rageEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!rageEffect) return;
    let choices = [
        ['CHRISPREMADES.Macros.WildSurge.ShadowyTendrils', 'shadowyTendrils'],
        ['CHRISPREMADES.Macros.WildSurge.Teleport', 'teleport'],
        ['CHRISPREMADES.Macros.WildSurge.IntangibleSpirit', 'intangibleSpirit'],
        ['CHRISPREMADES.Macros.WildSurge.MagicInfusion', 'magicInfusion'],
        ['CHRISPREMADES.Macros.WildSurge.Retribution', 'retribution'],
        ['CHRISPREMADES.Macros.WildSurge.ProtectiveLights', 'protectiveLights'],
        ['CHRISPREMADES.Macros.WildSurge.FlowersAndVines', 'flowersAndVines'],
        ['CHRISPREMADES.Macros.WildSurge.BoltOfLight', 'boltOfLight'],
    ];
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wildSurge');
    if (effect) await genericUtils.remove(effect);
    let controlledSurge = itemUtils.getItemByIdentifier(workflow.actor, 'controlledSurge');
    let rollFormula = controlledSurge ? '2d8' : '1d8';
    let roll = await new Roll(rollFormula).evaluate();
    roll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name + (controlledSurge ? '' : (': ' + genericUtils.translate(choices[roll.total - 1][0])))
    });
    let selection;
    if (controlledSurge) {
        let roll1 = roll.terms[0].values[0] - 1;
        let roll2 = roll.terms[0].values[1] - 1;
        let realChoices;
        if (roll1 === roll2) {
            realChoices = choices;
        } else {
            realChoices = [choices[roll1], choices[roll2]];
        }
        selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WildSurge.Select', realChoices);
        if (!selection) selection = realChoices[0][1];
    } else {
        selection = choices[roll.total - 1][1];
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: rageEffect.duration.remaining
        }
    };
    let feature;
    switch (selection) {
        case 'shadowyTendrils': {
            feature = activityUtils.getActivityByIdentifier(workflow.item, 'shadowyTendrils', {strict: true});
            if (!feature) return;
            await workflowUtils.syntheticActivityRoll(feature);
            let tRoll = await new CONFIG.Dice.DamageRoll('1d12[temphp]', {}, {type: 'temphp'}).evaluate();
            tRoll.toMessage({
                rollMode: 'roll',
                speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
                flavor: feature.name
            });
            await workflowUtils.applyDamage([workflow.token], tRoll.total, 'temphp');
            break;
        }
        case 'teleport':
            feature = activityUtils.getActivityByIdentifier(workflow.item, 'teleport', {strict: true});
            if (!feature) return;
            await effectUtils.createEffect(workflow.actor, effectData, {
                parentEntity: rageEffect, 
                identifier: 'wildSurge', 
                vae: [{
                    type: 'use', 
                    name: feature.name,
                    identifier: 'wildSurge',
                    activityIdentifier: 'teleport'
                }],
                unhideActivities: {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers: ['teleport'],
                    favorite: true
                }
            });
            feature.activation.type = 'special';
            await workflowUtils.syntheticActivityRoll(feature);
            feature.activation.type = 'bonuse';
            break;
        case 'intangibleSpirit':
            feature = activityUtils.getActivityByIdentifier(workflow.item, 'intangibleSpirit', {strict: true});
            if (!feature) return;
            await effectUtils.createEffect(workflow.actor, effectData, {
                parentEntity: rageEffect, 
                identifier: 'wildSurge', 
                vae: [{
                    type: 'use', 
                    name: feature.name, 
                    identifier: 'wildSurge',
                    activityIdentifier: 'intangibleSpirit'
                }],
                unhideActivities: {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers: ['intangibleSpirit'],
                    favorite: true
                }
            });
            feature.activation.type = 'special';
            await workflowUtils.syntheticActivityRoll(feature);
            feature.activation.type = 'bonus';
            break;
        case 'magicInfusion': {
            let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
            if (!weapons.length) return;
            let weapon;
            if (weapons.length === 1) {
                [weapon] = weapons;
            } else {
                weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ElementalCleaver.SelectWeapon', weapons);
                if (!weapon) return;
            }
            let baseType = weapon.system.damage.base.types.first();
            let newFormula = weapon.system.damage.base.formula.replaceAll(baseType, 'force');
            let versatileType = weapon.system.damage.versatile.types.first();
            let versatile = weapon.system.damage.versatile.formula.replaceAll(versatileType, 'force');
            let enchantData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                duration: {
                    seconds: rageEffect.duration.remaining
                },
                changes: [
                    {
                        key: 'name',
                        mode: 5,
                        value: '{} (' + genericUtils.translate('CHRISPREMADES.Macros.WildSurge.MagicInfusion') + ')',
                        priority: 20
                    },
                    {
                        key: 'system.damage.base.custom.enabled',
                        mode: 5,
                        value: '"true"',
                        priority: 20
                    },
                    {
                        key: 'system.damage.base.custom.formula',
                        mode: 5,
                        value: newFormula,
                        priority: 20
                    },
                    {
                        key: 'system.damage.base.types',
                        mode: 5,
                        value: '["force"]',
                        priority: 20
                    },
                    {
                        key: 'system.properties',
                        mode: 2,
                        value: '["thr", "lgt"]',
                        priority: 20
                    },
                    {
                        key: 'system.range.value',
                        mode: 4,
                        value: 20,
                        priority: 20
                    },
                    {
                        key: 'system.range.long',
                        mode: 4,
                        value: 60,
                        priority: 20
                    }
                ]
            };
            if (versatile?.length) {
                enchantData.changes.push({
                    key: 'system.damage.versatile.custom.enabled',
                    mode: 5,
                    value: '"true"',
                    priority: 20
                }, {
                    key: 'system.damage.versatile.custom.formula',
                    mode: 5,
                    value: versatile,
                    priority: 20
                }, {
                    key: 'system.damage.versatile.types',
                    mode: 5,
                    value: '["force"]',
                    priority: 20
                });
            }
            effect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: rageEffect, identifier: 'wildSurge'});
            await itemUtils.enchantItem(weapon, enchantData, {parentEntity: effect});
            break;
        }
        case 'retribution':
            feature = activityUtils.getActivityByIdentifier(workflow.item, 'retribution', {strict: true});
            if (!feature) return;
            effectUtils.addMacro(effectData, 'midi.actor', ['wildSurgeRetribution']);
            await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: rageEffect, identifier: 'wildSurge'});
            break;
        case 'protectiveLights':
            effectData.name = genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: effectData.name});
            effectUtils.addMacro(effectData, 'aura', ['wildSurgeProtectiveLights']);
            await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: rageEffect, identifier: 'wildSurge'});
            break;
        case 'flowersAndVines': {
            let templateData = {
                t: 'circle',
                x: workflow.token.center.x,
                y: workflow.token.center.y,
                distance: 15,
                direction: 0,
                angle: 0,
                user: game.user,
                fillColor: game.user.color
            };
            // This looks bad but actually it's good, they'll be allowed to do this and it means not socketing game.user
            let [template] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [templateData]);
            await tokenUtils.attachToToken(workflow.token, [template.uuid]);
            effect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: rageEffect, identifier: 'wildSurge'});
            await effectUtils.addDependent(effect, [template]);
            break;
        }
        case 'boltOfLight': {
            feature = activityUtils.getActivityByIdentifier(workflow.item, 'boltOfLight', {strict: true});
            if (!feature) return;
            effect = await effectUtils.createEffect(workflow.actor, effectData, {
                parentEntity: rageEffect, 
                identifier: 'wildSurge', 
                vae: [{
                    type: 'use', 
                    name: feature.name,
                    identifier: 'wildSurge',
                    activityIdentifier: 'boltOfLight'
                }],
                unhideActivities: {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers: ['boltOfLight'],
                    favorite: true
                }
            });
            let targets;
            let nearbyTargets = tokenUtils.findNearby(workflow.token, 30, 'enemy');
            if (!nearbyTargets?.length) return;
            if (nearbyTargets.length === 1) {
                targets = nearbyTargets;
            } else {
                let selection = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.WildSurge.Target', nearbyTargets);
                if (!selection?.length) return;
                targets = [selection[0]];
            }
            feature.activation.type = 'special';
            await workflowUtils.syntheticActivityRoll(feature, targets);
            feature.activation.type = 'bonus';
            break;
        }
    }
}
async function teleport({workflow}) {
    await Teleport.target([workflow.token], workflow.token, {range: 30, animation: 'mistyStep'});
}
async function intangibleSpirit({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Intangible Spirit', {translate: 'CHRISPREMADES.Macros.WildSurge.IntangibleSpirit'});
    if (!sourceActor) return;
    let saveDC = 8 + workflow.actor.system.attributes.prof + workflow.actor.system.abilities.con.mod;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Wild Surge: Intangible Spirit Explode', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WildSurge.IntangibleSpiritExplode', identifier: 'intangibleSpiritExplode', flatDC: saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'wildSurge');
    if (!originItem) return;
    let type = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WildSurge.Form', [
        ['CHRISPREMADES.Summons.CreatureNames.Flumph', 'flumph'],
        ['CHRISPREMADES.Summons.CreatureNames.Pixie', 'pixie']
    ]);
    if (!type?.length) type = 'flumph';
    let updates = {
        actor: {
            items: [featureData]
        }
    };
    let avatarImg = itemUtils.getConfig(originItem, type + 'Avatar');
    let tokenImg = itemUtils.getConfig(originItem, type + 'Token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 7,
        range: 30,
        initiativeType: 'none',
        customIdentifier: 'wildSurgeIntangibleSpirit'
    });
    if (!spawnedTokens?.length) return;
    let [spawnedToken] = spawnedTokens;
    let effect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!effect) return;
    await genericUtils.update(effect, {'flags.chris-premades.macros.combat': ['wildSurgeIntangibleSpirit']});
    let parentEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'wildSurge');
    if (!parentEffect) return;
    await effectUtils.addDependent(parentEffect, [effect]);
}
async function intangibleSpiritExplode({trigger: {entity: effect, token}}) {
    let item = itemUtils.getItemByIdentifier(token.actor, 'intangibleSpiritExplode');
    if (!item) return;
    await workflowUtils.completeItemUse(item, {}, {configureDialog: false});
    await genericUtils.remove(effect);
}
async function retribution({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'retribution', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token]);
}
async function protectiveLights({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let effectData = {
        name: effect.name.split(':')[0],
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    // await effectUtils.createEffect(target.actor, effectData, {identifier});
    return {
        effectData,
        effectOptions: {identifier}
    };
}
export let wildSurge = {
    name: 'Wild Surge',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['wildSurge']
            },
            {
                pass: 'rollFinished',
                macro: teleport,
                priority: 50,
                activities: ['teleport']
            },
            {
                pass: 'rollFinished',
                macro: intangibleSpirit,
                priority: 50,
                activities: ['intangibleSpirit']
            }
        ]
    },
    config: [
        {
            value: 'flumphToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Flumph',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'pixieToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Pixie',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'flumphAvatar',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Flumph',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'pikieAvatar',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Pixie',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ]
};
export let wildSurgeTeleport = {
    name: 'Wild Surge: Teleport',
    version: wildSurge.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: teleport,
                priority: 50
            }
        ]
    }
};
export let wildSurgeIntangibleSpirit = {
    name: 'Wild Surge: Intangible Spirit',
    version: wildSurge.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: intangibleSpirit,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'everyTurn',
            macro: intangibleSpiritExplode,
            priority: 50
        }
    ]
};
export let wildSurgeRetribution = {
    name: 'Wild Surge: Retribution',
    version: wildSurge.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: retribution,
                priority: 250
            }
        ]
    }
};
export let wildSurgeProtectiveLights = {
    name: 'Wild Surge: Protective Lights',
    version: wildSurge.version,
    aura: [
        {
            pass: 'create',
            macro: protectiveLights,
            priority: 50,
            distance: 10,
            identifier: 'wildSurgeAura',
            disposition: 'ally'
        }
    ]
};