import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'mageHand');
    if (effect) await genericUtils.remove(effect);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Mage Hand');
    if (!sourceActor) return;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = workflow.item.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
            },
            flags: {
                ['midi-qol']: {
                    neverTarget: true
                }
            }
        },
        token: {
            name
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let moveActivity = activityUtils.getActivityByIdentifier(workflow.item, 'move');
    if (!moveActivity) return;
    let additionalVaeButtons = [{
        type: 'use', 
        name: moveActivity.name,
        identifier: 'mageHand', 
        activityIdentifier: 'move'
    }];
    let unhideActivities = {
        itemUuid: workflow.item.uuid,
        activityIdentifiers: ['move'],
        favorite: true
    };
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds,
        range: workflow.activity.range.value,
        animation,
        initiativeType: 'none',
        additionalVaeButtons,
        unhideActivities
    });
    if (!spawnedTokens.length) return;
    let spawnedToken = spawnedTokens[0];
    let mageHandLegerdemain = itemUtils.getItemByIdentifier(workflow.actor, 'mageHandLegerdemain');
    if (mageHandLegerdemain) await effectUtils.applyConditions(spawnedToken.actor, ['invisible']);
    let summonedEffect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!summonedEffect) return;
    await genericUtils.setFlag(summonedEffect, 'chris-premades', 'macros.movement', ['mageHandEffect']);
}
async function move({trigger: {entity: effect, token}}) {
    let actor = await fromUuid(effect.parent.flags['chris-premades'].summons.control.actor);
    if (!actor) return;
    let sourceToken = actorUtils.getFirstToken(actor);
    if (!sourceToken) return;
    if (tokenUtils.getDistance(sourceToken, token, {wallsBlock: false, checkCover: false}) <= 30) return;
    let selection = await dialogUtils.confirm(effect.parent.name, 'CHRISPREMADES.Macros.MageHand.TooFar');
    if (!selection) return;
    await genericUtils.remove(effect);
}
export let mageHand = {
    name: 'Mage Hand',
    version: '1.3.38',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.MageHand',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.InvokeDuplicity',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.InvokeDuplicity',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let mageHandEffect = {
    name: 'Mage Hand: Effect',
    version: mageHand.version,
    rules: mageHand.rules,
    movement: [
        {
            pass: 'moved',
            macro: move,
            priority: 50
        }
    ]
};