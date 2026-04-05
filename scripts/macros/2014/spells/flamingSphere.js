import {Summons} from '../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let name = itemUtils.getConfig(workflow.item, 'name');
    let scale = Number(itemUtils.getConfig(workflow.item, 'scale'));
    if (isNaN(scale)) scale = 1;
    if (!name || name === '') name = workflow.item.name;
    if (!tokenImg || tokenImg === '') tokenImg = Sequencer.Database.getEntry('jb2a.flaming_sphere.400px.' + color + '.02').file;
    let damageUpdates = {
        flags: {
            'chris-premades': {
                flamingSphere: {
                    actorUuid: workflow.actor.uuid
                }
            }
        }
    };
    let damageFeature = await Summons.getSummonItem('Flaming Sphere: End Turn', damageUpdates, workflow.item, {flatDC: itemUtils.getSaveDC(workflow.item), damageFlat: workflowUtils.getCastLevel(workflow) + 'd6[fire]', translate: 'CHRISPREMADES.Macros.FlamingSphere.EndTurn'});
    if (!damageFeature) {
        errors.missingPackItem(constants.packs.summonFeatures, 'Flaming Sphere: End Turn');
        return;
    }
    let ramFeature = await Summons.getSummonItem('Flaming Sphere: Ram', damageUpdates, workflow.item,{flatDC: itemUtils.getSaveDC(workflow.item), damageFlat: workflowUtils.getCastLevel(workflow) + 'd6[fire]', translate: 'CHRISPREMADES.Macros.FlamingSphere.RamItem'});
    if (!ramFeature) {
        errors.missingPackItem(constants.packs.summonFeatures, 'Flaming Sphere: Ram');
        return;
    }
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name,
                texture: {
                    src: tokenImg,
                    scaleX: scale,
                    scaleY: scale
                }
            },
            items: [
                damageFeature,
                ramFeature
            ]
        },
        token: {
            name,
            texture: {
                src: tokenImg,
                scaleX: scale,
                scaleY: scale
            }
        }
    };
    if (avatarImg) genericUtils.setProperty(updates, 'actor.img', avatarImg);
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let actor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Flaming Sphere');
    if (!actor) {
        errors.missingPackItem(constants.packs.summons, 'CPR - Flaming Sphere');
        return;
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'flamingSphereMove', {strict: true});
    if (!feature) return;
    let [token] = await Summons.spawn(actor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds, 
        range: 60, 
        animation, 
        initiativeType: 'none', 
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'flamingSphere',
            activityIdentifier: 'flamingSphereMove'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['flamingSphereMove'],
            favorite: true
        }
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flamingSphere');
    if (!effect) return;
    await genericUtils.update(effect, {
        'flags.chris-premades.flamingSphere.tokenUuid': token.uuid
    });
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flamingSphere');
    if (!effect) return;
    let tokenUuid = effect.flags['chris-premades']?.flamingSphere?.tokenUuid;
    if (!tokenUuid) return;
    let token = await fromUuid(tokenUuid);
    if (!token) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({
        token: token.object, 
        maxRange: genericUtils.convertDistance(30), 
        centerpoint: token.object.center, 
        drawBoundries: true, 
        trackDistance: true, 
        fudgeDistance: token.width * canvas.dimensions.distance / 2,
        crosshairsConfig: {
            size: canvas.grid.distance * token.width / 2,
            icon: token.texture.src,
            resolution: (token.width % 2) ? 1 : -1
        }
    });
    if (position.cancelled) return;
    let xOffset = token.width * canvas.grid.size / 2;
    let yOffset = token.height * canvas.grid.size / 2;
    await genericUtils.update(token, {x: (position.x ?? token.center.x) - xOffset, y: (position.y ?? token.center.y) - yOffset});
    await token.object.movementAnimationPromise;
    let nearbyTokens = tokenUtils.findNearby(token.object, 5, 'all', {includeIncapacitated: true});
    if (!nearbyTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.FlamingSphere.Ram', nearbyTokens, {buttons: 'okCancel', skipDeadAndUnconscious: false});
    if (!selection?.length) return;
    let ramFeature = itemUtils.getItemByIdentifier(token.actor, 'flamingSphereRam');
    if (!ramFeature) return;
    let featureData = duplicate(ramFeature.toObject());
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [selection[0]]);
    await workflow.actor.sheet.maximize();
}
async function endTurn({trigger}) {
    let actorUuid = trigger.entity.flags['chris-premades']?.flamingSphere?.actorUuid;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    let featureData = duplicate(trigger.entity.toObject());
    await workflowUtils.syntheticItemDataRoll(featureData, trigger.entity.actor, [trigger.target]);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let flamingSphere = {
    name: 'Flaming Sphere',
    version: '1.2.28',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['flamingSphere']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['flamingSphereMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['flamingSphereMove']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FlamingSphere',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FlamingSphere',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FlamingSphere',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'orange',
            category: 'animation',
            options: [
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange'
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'scale',
            label: 'CHRISPREMADES.Config.Scale',
            type: 'text',
            default: 2,
            category: 'summons'
        }
    ]
};
export let flamingSphereEndTurn = {
    name: 'Flaming Sphere: End Turn',
    version: '1.0.25',
    combat: [
        {
            pass: 'turnEndNear',
            macro: endTurn,
            priority: 50,
            distance: 5
        }
    ]
};
export let flamingSphereRam = {
    name: 'Flaming Sphere: Ram',
    version: '1.0.25'
};