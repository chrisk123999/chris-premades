import {Summons} from '../../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeeps');
    if (effect) await genericUtils.remove(effect);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Spectral Tentacle');
    if (!sourceActor) return;
    let name = genericUtils.translate('CHRISPREMADES.Macros.TentacleOfTheDeeps.Name');
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
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
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'tentacleOfTheDeepsAttack', {strict: true});
    if (!feature) return;
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60,
        range: 60,
        animation,
        initiativeType: 'none',
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'tentacleOfTheDeeps',
            activityIdentifier: 'tentacleOfTheDeepsAttack'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['tentacleOfTheDeepsAttack'],
            favorite: true
        }
    });
}
async function early({activity, token, actor}) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'tentacleOfTheDeeps');
    if (!effect) return;
    let tentacleActor = token.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!tentacleActor) return;

    let effectData = {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.item.uuid,
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
    await effectUtils.createEffect(actor, effectData, {identifier: 'tentacleOfTheDeepsAttack', parentEntity: effect});
    await effectUtils.createEffect(tentacleActor, effectData, {identifier: 'tentacleOfTheDeepsAttack', parentEntity: effect});
    let classLevel = actor.classes.warlock?.system.levels ?? 1;
    let numDice = (classLevel > 9) ? 2 : 1;
    let formula = numDice + activity.damage.parts[0].formula.slice(1);
    await activityUtils.setDamage(activity, formula);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeeps');
    if (!effect) return;
    let tentacleActor = workflow.token.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!tentacleActor) return;
    let summonerEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeepsAttack');
    let summonedEffect = effectUtils.getEffectByIdentifier(tentacleActor, 'tentacleOfTheDeepsAttack');
    if (summonerEffect) await genericUtils.remove(summonerEffect);
    if (summonedEffect) await genericUtils.remove(summonedEffect);
}
export let tentacleOfTheDeeps = {
    name: 'Tentacle of the Deeps: Summon',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['tentacleOfTheDeeps']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['tentacleOfTheDeepsAttack']
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50,
                activities: ['tentacleOfTheDeepsAttack']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'water',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.TentacleOfTheDeeps',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.TentacleOfTheDeeps',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ],
    ddbi: {
        removedItems: {
            'Tentacle of the Deeps: Summon': [
                'Tentacle of the Deeps: Move',
                'Tentacle of the Deeps: Attack'
            ]
        }
    }
};