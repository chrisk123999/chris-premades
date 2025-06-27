import {Summons} from '../../../../../lib/summons.js';
import {Teleport} from '../../../../../lib/teleport.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
// TODO: link up saving throws to current bonuses each time? Or is the below sufficient
async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Echo Knight');
    if (!sourceActor) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestEcho');
    let sceneEchos = [];
    if (effect) sceneEchos = effect.flags['chris-premades'].summons.ids[effect.name].map(i => workflow.token.scene.tokens.get(i));
    let teleportFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestEchoTeleport', {strict: true});
    let attackFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestEchoAttack', {strict: true});
    let dismissFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestEchoDismiss', {strict: true});
    if (!teleportFeature || !attackFeature || !dismissFeature) return;
    let legion = itemUtils.getItemByIdentifier(workflow.actor, 'legionOfOne');
    let makeTwo = false;
    if (legion) {
        if (!sceneEchos.length) {
            makeTwo = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.ManifestEcho.Legion');
        } else if (sceneEchos.length > 1) {
            await genericUtils.remove(effect);
        }
    } else if (effect) {
        genericUtils.remove(effect);
    }
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.format('CHRISPREMADES.Macros.ManifestEcho.Echo', {name: workflow.token.name});
    let updates = {
        actor: {
            name,
            system: {
                abilities: workflow.actor.system.abilities,
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof),
                    type: workflow.actor.system.details.type
                },
                traits: {
                    size: workflow.actor.system.traits.size
                },
                attributes: {
                    ac: {
                        flat: 14 + workflow.actor.system.attributes.prof
                    },
                    senses: workflow.actor.system.senses
                }
            },
            prototypeToken: {
                name,
                sight: workflow.actor.prototypeToken.sight,
                width: workflow.token.document.width,
                height: workflow.token.document.height
            }
        },
        token: {
            name,
            sight: workflow.actor.prototypeToken.sight,
            width: workflow.token.document.width,
            height: workflow.token.document.height
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (!tokenImg?.length) tokenImg = workflow.token.document.texture.src;
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let vaeButtons = [
        {type: 'use', name: teleportFeature.name, identifier: 'manifestEcho', activityIdentifier: 'manifestEchoTeleport'},
        {type: 'use', name: attackFeature.name, identifier: 'manifestEcho', activityIdentifier: 'manifestEchoAttack'}
    ];
    let echoAvatar = itemUtils.getItemByIdentifier(workflow.actor, 'echoAvatar');
    if (echoAvatar) vaeButtons.push({type: 'use', name: echoAvatar.name, identifier: 'echoAvatar'});
    let unleashIncarnation = itemUtils.getItemByIdentifier(workflow.actor, 'unleashIncarnation');
    if (unleashIncarnation) vaeButtons.push({type: 'use', name: unleashIncarnation.name, identifier: 'unleashIncarnation'});
    let spawnedTokens = await Summons.spawn(makeTwo ? [sourceActor, sourceActor] : sourceActor, updates, workflow.item, workflow.token, {
        range: 15,
        animation,
        initiativeType: 'follows',
        dismissActivity: dismissFeature,
        additionalVaeButtons: vaeButtons,
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['manifestEchoTeleport', 'manifestEchoAttack', 'manifestEchoDismiss'],
            favorite: true
        }
    });
    if (!spawnedTokens?.length) return;
    effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestEcho');
    if (!effect) return;
    await genericUtils.update(effect, {'flags.chris-premades.macros.combat': ['manifestEchoActive']});
    let applyFilter = (itemUtils.getConfig(workflow.item, 'filter') ?? true) && game.modules.get('tokenmagic')?.active;
    let filter = [
        {
            'filterType': 'oldfilm',
            'filterId': 'myOldfilm',
            'sepia': 0.6,
            'noise': 0.2,
            'noiseSize': 1.0,
            'scratch': 0.8,
            'scratchDensity': 0.5,
            'scratchWidth': 1.2,
            'vignetting': 0.9,
            'vignettingAlpha': 0.6,
            'vignettingBlur': 0.2,
            'animated':
            {
                'seed': { 
                    'active': true, 
                    'animType': 'randomNumber', 
                    'val1': 0, 
                    'val2': 1 
                },
                'vignetting': { 
                    'active': true, 
                    'animType': 'syncCosOscillation' , 
                    'loopDuration': 2000, 
                    'val1': 0.2, 
                    'val2': 0.4
                }
            }
        },
        {
            'filterType': 'outline',
            'filterId': 'oldfilmOutline',
            'color': 0x000000,
            'thickness': 0,
            'zOrder': 61
        },
        {
            'filterType': 'fog',
            'filterId': 'myFog',
            'color': 0x000000,
            'density': 0.65,
            'time': 0,
            'dimX': 1,
            'dimY': 1,
            'animated': {
                'time': { 
                    'active': true, 
                    'speed': 2.2, 
                    'animType': 'move' 
                }
            }
        }
    ];
    let reclaimPotential = itemUtils.getItemByIdentifier(workflow.actor, 'reclaimPotential');
    for (let i of spawnedTokens) {
        // eslint-disable-next-line no-undef
        if (applyFilter) await TokenMagic.addFilters(i.object, filter);
        if (!reclaimPotential) continue;
        let targetEffect = effectUtils.getEffectByIdentifier(i.actor, 'summonedEffect');
        await genericUtils.update(targetEffect, {'flags.chris-premades.macros.midi.actor': ['manifestEchoActive']});
    }
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestEcho');
    if (effect) await genericUtils.remove(effect);
}
async function teleport({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestEcho');
    if (!effect) return;
    let sceneEchos = effect.flags['chris-premades'].summons.ids[effect.name].map(i => workflow.token.scene.tokens.get(i)?.object).filter(i => i);
    if (!sceneEchos.length) return;
    let targetToken;
    if (sceneEchos.length > 1) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.ManifestEcho.Which', sceneEchos);
        if (!selection?.length) return;
        targetToken = selection[0];
    } else {
        targetToken = sceneEchos[0];
    }
    let origPos = workflow.token.center;
    let newPos = targetToken.center;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let origTeleport = new Teleport([workflow.token], workflow.token, {animation: playAnimation ? 'mistyStep' : 'none'});
    let newTeleport = new Teleport([targetToken], targetToken, {animation: playAnimation ? 'mistyStep' : 'none'});
    origTeleport.template = {
        direction: 0,
        x: newPos.x,
        y: newPos.y
    };
    newTeleport.template = {
        direction: 0,
        x: origPos.x,
        y: origPos.y
    };
    await Promise.all([origTeleport._move(), newTeleport._move()]);
}
export async function attack({workflow}) {
    if (!workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestEcho');
    if (!effect) return;
    let sceneEchos = effect.flags['chris-premades'].summons.ids[effect.name].map(i => workflow.token.scene.tokens.get(i)?.object).filter(i => i);
    if (!sceneEchos.length) return;
    let targetToken;
    if (sceneEchos.length > 1) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.ManifestEcho.Which', sceneEchos);
        if (!selection?.length) return;
        targetToken = selection[0];
    } else {
        targetToken = sceneEchos[0];
    }
    let features = workflow.actor.items.filter(i => i.hasAttack && (i.type === 'weapon' ? i.system.equipped : true));
    if (!features.length) {
        genericUtils.notify('CHRISPREMADES.Macros.ManifestEcho.NoWeapons', 'info');
        return;
    }
    let feature;
    if (features.length > 1) {
        feature = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ManifestEcho.Weapon', features);
        if (!feature) return;
    } else {
        feature = features[0];
    }
    let effectData = {
        name: 'Range Override',
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let effect1 = await effectUtils.createEffect(workflow.actor, effectData);
    let effect2 = await effectUtils.createEffect(targetToken.actor, effectData);
    await workflowUtils.syntheticItemRoll(feature, Array.from(workflow.targets));
    await genericUtils.remove(effect1);
    await genericUtils.remove(effect2);
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let sceneEchos = effect.flags['chris-premades'].summons.ids[effect.name].map(i => token.scene.tokens.get(i)?.object).filter(i => i);
    if (!sceneEchos.length) {
        await genericUtils.remove(effect);
        return;
    }
    let maxRange = effectUtils.getEffectByIdentifier(token.actor, 'echoAvatar') ? genericUtils.handleMetric(1000) : genericUtils.handleMetric(30);
    let echosLeft = sceneEchos.length;
    for (let i of sceneEchos) {
        let distance = tokenUtils.getDistance(token, i);
        if (distance > maxRange) {
            let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.ManifestEcho.Far', {actorName: token.actor.name}), {userId: socketUtils.gmID()});
            if (!selection) continue;
            let tokenEffect = effectUtils.getEffectByIdentifier(i.actor, 'summonedEffect');
            if (tokenEffect) await genericUtils.remove(tokenEffect);
            echosLeft -= 1;
        }
    }
    if (!echosLeft) await genericUtils.remove(effect);
}
async function targetApplyDamage({trigger, ditem}) {
    if (!(await Summons.dismissIfDead({trigger, ditem}))) return;
    let effect = await fromUuid(trigger.entity?.flags?.['chris-premades']?.parentEntityUuid);
    if (!effect) return;
    let originActor = effect.parent;
    if (!originActor) return;
    if (originActor.system.attributes.hp.temp) return;
    let originItem = itemUtils.getItemByIdentifier(originActor, 'reclaimPotential');
    if (!originItem || !originItem.system.uses.value) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(originItem, {}, {configureDialog: false});
}
export let manifestEcho = {
    name: 'Manifest Echo',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['manifestEcho']
            },
            {
                pass: 'rollFinished',
                macro: teleport,
                priority: 50,
                activities: ['manifestEchoTeleport']
            },
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50,
                activities: ['manifestEchoAttack']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['manifestEchoDismiss']
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Echo',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Echo',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Echo',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'filter',
            label: 'CHRISPREMADES.Config.ApplyFilter',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Echo',
            type: 'select',
            default: 'smoke',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayTeleportAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    ddbi: {
        removedItems: {
            'Manifest Echo': [
                'Manifest Echo - Attack',
                'Manifest Echo - Teleport',
                'Manifest Echo - Opportunity Attack'
            ]
        }
    }
};
export let manifestEchoActive = {
    name: 'Manifest Echo: Active',
    version: manifestEcho.version,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: targetApplyDamage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};