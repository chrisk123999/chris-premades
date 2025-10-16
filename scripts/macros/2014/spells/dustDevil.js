import {Summons} from '../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, crosshairUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let name = itemUtils.getConfig(workflow.item, 'name');
    let scale = Number(itemUtils.getConfig(workflow.item, 'scale'));
    if (isNaN(scale)) scale = 1;
    if (!name || name === '') name = workflow.item.name;
    if (!tokenImg || tokenImg === '') tokenImg = Sequencer.Database.getEntry('jb2a.whirlwind.' + color).file;
    let damageUpdates = {
        flags: {
            'chris-premades': {
                dustDevil: {
                    actorUuid: workflow.actor.uuid
                }
            }
        }
    };
    // 1d8 bludgeoning, scaling +1d8 per slot above 2nd => (castLevel - 1)d8
    let diceCount = Math.max(1, (workflowUtils.getCastLevel(workflow) - 1));
    let contactFeature = await Summons.getSummonItem('Dust Devil: Contact', damageUpdates, workflow.item, {flatDC: itemUtils.getSaveDC(workflow.item), damageFlat: diceCount + 'd8[bludgeoning]', translate: 'CHRISPREMADES.Macros.DustDevil.ContactItem'});
    if (!contactFeature) {
        errors.missingPackItem(constants.packs.summonFeatures, 'Dust Devil: Contact');
        return;
    }
    let updates = {
        actor: {
            name,
            system: {
                attributes: {
                    hp: { value: 1000, max: 1000 }
                }
            },
            prototypeToken: {
                name,
                disposition: 0,
                texture: {
                    src: tokenImg,
                    scaleX: scale,
                    scaleY: scale
                }
            },
            items: [
                contactFeature
            ]
        },
        token: {
            name,
            disposition: 0,
            texture: {
                src: tokenImg,
                scaleX: scale,
                scaleY: scale
            }
        }
    };
    if (avatarImg) genericUtils.setProperty(updates, 'actor.img', avatarImg);
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let actor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Dust Devil');
    if (!actor) {
        errors.missingPackItem(constants.packs.summons, 'CPR - Dust Devil');
        return;
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dustDevilMove');
    if (!feature) return;
    let [token] = await Summons.spawn(actor, updates, workflow.item, workflow.token,{
        duration: itemUtils.convertDuration(workflow.item).seconds,
        range: 60,
        animation,
        initiativeType: 'none',
        additionalVaeButtons: [{
            type: 'use',
            name: feature.name,
            identifier: 'dustDevil',
            activityIdentifier: 'dustDevilMove'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dustDevilMove'],
            favorite: true
        },
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dustDevil');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'dustDevil.tokenUuid', token.uuid);
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dustDevil');
    if (!effect) return;
    let tokenUuid = effect.flags['chris-premades']?.dustDevil?.tokenUuid;
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
    // Create a visual effect around the token (no template, combat-only)
    if (!game.combat) {
        await workflow.actor.sheet.maximize();
        return;
    }
    // End any previous ring visuals for this token (if any)
    let seqName = 'cpr-dust-devil-token-' + token.id;
    Sequencer.EffectManager.endEffects({ name: seqName, object: token.object });
    new Sequence()
        .effect()
        .file('jb2a.smoke.ring.01.white')
        .attachTo(token.object, { bindScale: false })
        .scaleToObject(7)
        .opacity(.5)
        .tint('#666666')
        .belowTokens()
        .fadeIn(250)
        .fadeOut(250)
        .persist()
        .name(seqName)
        .play();
    // Cleanup: when this actor's next turn starts, stop the visual
    let ownerUuid = workflow.actor.uuid;
    let endVisual = async () => {
        Sequencer.EffectManager.endEffects({ name: seqName, object: token.object });
        if (combatHookId) Hooks.off('updateCombat', combatHookId);
        Hooks.off('deleteCombat', deleteHookId);
    };
    let combatHookId = Hooks.on('updateCombat', (combat, changes) => {
        if (!changes.turn && !changes.round) return;
        let active = combat.combatant?.actor?.uuid;
        if (active === ownerUuid) endVisual();
    });
    let deleteHookId = Hooks.on('deleteCombat', () => endVisual());
    await workflow.actor.sheet.maximize();
}
async function endTurn({trigger}) {
    let actorUuid = trigger.entity.flags['chris-premades']?.dustDevil?.actorUuid;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    // Restore reference to the spawned Dust Devil token from the effect
    let effect = effectUtils.getEffectByIdentifier(actor, 'dustDevil');
    if (!effect) return;
    let tokenUuid = effect.flags['chris-premades']?.dustDevil?.tokenUuid;
    if (!tokenUuid) return;
    let devilToken = await fromUuid(tokenUuid);
    if (!devilToken) return;
    let featureData = genericUtils.duplicate(trigger.entity.toObject());
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, trigger.entity.actor, [trigger.target]);
    if (featureWorkflow.failedSaves.find(t => t.id === trigger.target.id)) {
        // Ensure we pass Token objects (not Documents) to pushToken
        let targetToken = trigger.target?.object ?? trigger.target;
        await tokenUtils.pushToken(devilToken.object, targetToken, 10);
    }
}
async function early({dialog}) {
    dialog.configure = false;
}
export let dustDevil = {
    name: 'Dust Devil',
    version: '1.3.17',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['dustDevil']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['dustDevilMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['dustDevilMove']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DustDevil',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DustDevil',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DustDevil',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                },
                {
                    value: 'bluegrey',
                    label: 'CHRISPREMADES.Config.Colors.BlueGrey',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'bluewhite',
                    label: 'CHRISPREMADES.Config.Colors.BlueWhite',
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
export let dustDevilEndTurn = {
    name: 'Dust Devil: End Turn',
    version: dustDevil.version,
    combat: [
        {
            pass: 'turnEndNear',
            macro: endTurn,
            priority: 50,
            distance: 5
        }
    ]
};
export let dustDevilContact = {
    name: 'Dust Devil: Contact',
    version: dustDevil.version
};
