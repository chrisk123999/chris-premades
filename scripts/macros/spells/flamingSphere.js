import {Summons} from '../../lib/summons.js';
import {compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
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
    let damageFeature = await Summons.getSummonItem('Flaming Sphere: End Turn', damageUpdates, workflow.item, {flatDC: itemUtils.getSaveDC(workflow.item), damageFlat: workflow.castData.castLevel + 'd6[fire]', translate: 'CHRISPREMADES.Macros.FlamingSphere.EndTurn'});
    if (!damageFeature) {
        errors.missingPackItem(constants.packs.summonFeatures, 'Flaming Sphere: End Turn');
        return;
    }
    let ramFeature = await Summons.getSummonItem('Flaming Sphere: Ram', damageUpdates, workflow.item,{flatDC: itemUtils.getSaveDC(workflow.item), damageFlat: workflow.castData.castLevel + 'd6[fire]', translate: 'CHRISPREMADES.Macros.FlamingSphere.RamItem'});
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
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Flaming Sphere: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FlamingSphere.Move', identifier: 'flamingSphereMove'});
    if (!featureData) {
        errors.missingPackItem(constants.packs.spellFeatures, 'Flaming Sphere: Move');
        return;
    }
    genericUtils.setProperty(featureData, 'flags.chris-premades.flamingSphere.castLevel', workflow.castData.castLevel);
    let [token] = await Summons.spawn(actor, updates, workflow.item, workflow.token, {duration: itemUtils.convertDuration(workflow.item).seconds, range: 60, animation, initiativeType: 'none', additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'flamingSphereMove'}]});
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flamingSphere');
    if (!effect) return;
    genericUtils.setProperty(featureData, 'flags.chris-premades.flamingSphere.tokenUuid', token.uuid);
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: effect});
}
async function endTurn({trigger}) {
    let actorUuid = trigger.entity.flags['chris-premades']?.flamingSphere?.actorUuid;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    let featureData = duplicate(trigger.entity.toObject());
    delete featureData._id;
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [trigger.target]);
}
async function move({trigger, workflow}) {
    let tokenUuid = trigger.entity.flags['chris-premades']?.flamingSphere?.tokenUuid;
    if (!tokenUuid) return;
    let token = await fromUuid(tokenUuid);
    if (!token) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({
        token: token.object, 
        maxRange: 30, 
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
    // eslint-disable-next-line no-undef
    await CanvasAnimation.getAnimation(token.object.animationName)?.promise;
    let nearbyTokens = tokenUtils.findNearby(token.object, 5, 'all', {includeIncapacitated: true});
    if (!nearbyTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.FlamingSphere.Ram', nearbyTokens, {buttons: 'okCancel', skipDeadAndUnconscious: false});
    if (!selection) return;
    let ramFeature = itemUtils.getItemByIdentifier(token.actor, 'flamingSphereRam');
    if (!ramFeature) return;
    let featureData = duplicate(ramFeature.toObject());
    delete featureData._id;
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [selection[0]]);
    await workflow.actor.sheet.maximize();
}
export let flamingSphere = {
    name: 'Flaming Sphere',
    version: '1.0.25',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    hasAnimation: true,
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
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
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
export let flamingSphereMove = {
    name: 'Flaming Sphere: Move',
    version: '1.0.25',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50
            }
        ]
    }
};
export let flamingSphereRam = {
    name: 'Flaming Sphere: Ram',
    version: '1.0.25'
};