import {Summons} from '../../../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils} from '../../../../utils.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Manifest Mind');
    if (!sourceActor) return;
    let castFeature = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Manifest Mind: Cast Spell', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ManifestMind.Cast', identifier: 'manifestMindCastSpell'});
    let moveFeature = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Manifest Mind: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ManifestMind.Move', identifier: 'manifestMindMove'});
    let dismissData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Manifest Mind: Dismiss', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ManifestMind.Dismiss', identifier: 'manifestMindDismiss'});
    if (!castFeature || !moveFeature || !dismissData) {
        errors.missingPackItem();
        return;
    }
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.ManifestMind');
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            }
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
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
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 60,
        animation,
        initiativeType: 'none',
        dismissItem: dismissData,
        additionalVaeButtons: [{type: 'use', name: castFeature.name, identifier: 'manifestMindCastSpell'}, {type: 'use', name: moveFeature.name, identifier: 'manifestMindMove'}]
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    if (!effect) return;
    let castUsesRemaining = workflow.item.flags['chris-premades'].manifestMind?.uses ?? -1;
    if (castUsesRemaining < 0) {
        castUsesRemaining = workflow.actor.system.attributes.prof;
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'manifestMind.uses', castUsesRemaining);
    }
    castFeature.system.uses.value = castUsesRemaining;
    await itemUtils.createItems(workflow.actor, [castFeature, moveFeature, dismissData], {favorite: true, parentEntity: effect});
    let dismissItem = itemUtils.getItemByIdentifier(workflow.actor, genericUtils.getIdentifier(dismissData));
    if (!dismissItem) return;
    await effectUtils.addDependent(dismissItem, [effect]);
    await genericUtils.update(effect, {'flags.chris-premades.macros.combat': ['manifestMind']});
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let mindToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!mindToken) {
        await genericUtils.remove(effect);
        return;
    }
    if (tokenUtils.getDistance(token, mindToken) > 300) {
        let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.ManifestMind.Far', {actorName: token.actor.name}), {userId: socketUtils.gmID()});
        if (!selection) return;
        await genericUtils.remove(effect);
    }
}
async function useCast({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    if (!effect) return;
    let mindToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!mindToken) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Spell'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['manifestMindCast']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, effectData);
    await effectUtils.createEffect(mindToken.actor, effectData, {parentEntity: casterEffect});
}
async function early({workflow}) {
    if (workflow.item.type !== 'spell') {
        genericUtils.notify('CHRISPREMADES.Macros.ManifestMind.Invalid', 'info');
        workflow.aborted = true;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'manifestMind');
    if (!effect || !originItem) {
        workflow.aborted = true;
        return;
    }
    await genericUtils.setFlag(originItem, 'chris-premades', 'manifestMind.uses', workflow.item.system.uses.value);
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'manifestMind.uses', item.actor.system.attributes.prof);
}
export let manifestMind = {
    name: 'Manifest Mind: Summon',
    version: '0.12.62',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ManifestMind',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ManifestMind',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ManifestMind',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ManifestMind',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ]
};
export let manifestMindCast = {
    name: 'Manifest Mind: Cast',
    version: manifestMind.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useCast,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    }
};