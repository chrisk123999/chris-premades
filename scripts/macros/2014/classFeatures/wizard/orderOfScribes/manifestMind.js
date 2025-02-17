import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Manifest Mind');
    if (!sourceActor) return;
    let castFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestMindCast', {strict: true});
    let moveFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestMindMove', {strict: true});
    let dismissFeature = activityUtils.getActivityByIdentifier(workflow.item, 'manifestMindDismiss');
    if (!castFeature || !moveFeature || !dismissFeature) return;
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
        dismissActivity: dismissFeature,
        additionalVaeButtons: [{
            type: 'use', 
            name: castFeature.name, 
            identifier: 'manifestMind',
            activityIdentifier: 'manifestMindCast'
        }, {
            type: 'use', 
            name: moveFeature.name, 
            identifier: 'manifestMind',
            activityIdentifier: 'manifestMindMove'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['manifestMindCast', 'manifestMindMove', 'manifestMindDismiss'],
            favorite: true
        }
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    if (!effect) return;
    await genericUtils.update(effect, {'flags.chris-premades.macros.combat': ['manifestMind']});
}
async function cast({workflow}) {
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
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'manifestMind');
    if (effect) await genericUtils.remove(effect);
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
async function early({activity, actor}) {
    if (activity.item.type !== 'spell') {
        genericUtils.notify('CHRISPREMADES.Macros.ManifestMind.Invalid', 'info');
        return true;
    }
    let effect = effectUtils.getEffectByIdentifier(actor, 'manifestMind');
    let originItem = itemUtils.getItemByIdentifier(actor, 'manifestMind');
    if (!effect || !originItem) {
        return true;
    }
}
export let manifestMind = {
    name: 'Manifest Mind: Summon',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['manifestMind']
            },
            {
                pass: 'rollFinished',
                macro: cast,
                priority: 50,
                activities: ['manifestMindCast']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['manifestMindDismiss']
            }
        ]
    },
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
    ],
    ddbi: {
        removedItems: {
            'Manifest Mind: Summon': [
                'Manifest Mind: Cast Spell',
                'Manifest Mind: Move'
            ]
        }
    }
};
export let manifestMindCast = {
    name: 'Manifest Mind: Cast',
    version: manifestMind.version,
    midi: {
        actor: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    }
};