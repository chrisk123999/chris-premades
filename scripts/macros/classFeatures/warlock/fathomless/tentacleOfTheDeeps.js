import {Summons} from '../../../../lib/summons.js';
import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

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
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Tentacle of the Deeps: Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.TentacleOfTheDeeps.Attack', identifier: 'tentacleOfTheDeepsAttack'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let numDice = 1;
    if (workflow.actor.classes?.warlock?.system?.levels > 9) numDice = 2;
    featureData.system.damage.parts[0][0] = numDice + 'd8[cold]';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60,
        range: 60,
        animation,
        initiativeType: 'none',
        additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'tentacleOfTheDeepsAttack'}]
    });
    effect = effectUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeeps');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect});
}
async function early({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeeps');
    if (!effect) return;
    let tentacleActor = workflow.token.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!tentacleActor) return;

    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
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
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'tentacleOfTheDeepsAttack', parentEntity: effect});
    await effectUtils.createEffect(tentacleActor, effectData, {identifier: 'tentacleOfTheDeepsAttack', parentEntity: effect});
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
    version: '0.12.54',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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
    ]
};
export let tentacleOfTheDeepsAttack = {
    name: 'Tentacle of the Deeps: Attack',
    version: tentacleOfTheDeeps.version,
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50
            }
        ]
    }
};