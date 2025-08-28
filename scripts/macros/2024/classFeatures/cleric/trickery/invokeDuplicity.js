import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Invoke Duplicity');
    if (!sourceActor) return;
    let unhideActivities = [{
        itemUuid: workflow.item.uuid,
        activityIdentifiers: ['castSpells', 'move'],
        favorite: true
    }];
    let castSpells = activityUtils.getActivityByIdentifier(workflow.item, 'castSpells', {strict: true});
    let move = activityUtils.getActivityByIdentifier(workflow.item, 'move', {strict: true});
    let dismiss = activityUtils.getActivityByIdentifier(workflow.item, 'dismiss', {strict: true});
    if (!castSpells || !move || !dismiss) return;
    let additionalVaeButtons = [
        {
            type: 'use',
            name: move.name,
            identifier: 'invokeDuplicity',
            activityIdentifier: 'move'
        },
        {
            type: 'use',
            name: castSpells.name,
            identifier: 'invokeDuplicity',
            activityIdentifier: 'castSpells'
        },
        {
            type: 'use',
            name: dismiss.name,
            identifier: 'invokeDuplicity',
            activityIdentifier: 'dismiss'
        }
    ];
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = sourceActor.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
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
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.activity).seconds,
        range: workflow.activity.range.value,
        animation,
        additionalVaeButtons,
        unhideActivities,
        initiativeType: 'none'
    });
    if (!spawnedTokens.length) return;
    let spawnedToken = spawnedTokens[0];
    let effect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!effect) return;
    let improvedDuplicity = itemUtils.getItemByIdentifier(workflow.actor, 'improvedDuplicity');
    let macroName = improvedDuplicity ? 'improvedDuplicityEffect' : 'invokeDuplicityDistract';
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.midi.actor', [...effect.flags['chris-premades'].macros.midi.actor, macroName]);
    if (improvedDuplicity) {
        let duplicityEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'invokeDuplicity');
        if (duplicityEffect) await genericUtils.setFlag(duplicityEffect, 'chris-premades', 'macros.effect', [...duplicityEffect.flags['chris-premades'].macros.effect, 'improvedDuplicityEffect']);
    }
    let trickstersTransposition = itemUtils.getItemByIdentifier(workflow.actor, 'trickstersTransposition');
    if (!trickstersTransposition) return;
    let selection = await dialogUtils.confirm(trickstersTransposition.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: trickstersTransposition.name}));
    if (selection) await workflowUtils.completeItemUse(trickstersTransposition);
}
async function attack({trigger: {entity: effect}, workflow}) {
    if (!workflow.activity || !workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    if (origin.actor.uuid != workflow.actor.uuid) return;
    let duplicityToken = actorUtils.getFirstToken(effect.parent);
    if (!duplicityToken) return;
    if (tokenUtils.getDistance(workflow.token, duplicityToken) > genericUtils.handleMetric(5)) return;
    if (!tokenUtils.canSee(workflow.targets.first(), duplicityToken)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + origin.name);
}
async function spell({trigger, workflow}) {
    if (!workflow.token) return;
    let effectData = {
        name: workflow.activity.name,
        img: workflow.activity.img,
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
                specialDuration: ['1Spell']
            }
        }
    };
    let duplicityEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'invokeDuplicity');
    if (!duplicityEffect) return;
    let duplicityToken = workflow.token.document.parent.tokens.get(duplicityEffect.flags['chris-premades'].summons.ids[workflow.item.name][0]);
    if (!duplicityToken) return;
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    await effectUtils.createEffect(duplicityToken.actor, effectData, {parentEntity: effect});
}
async function dismiss({trigger, workflow}) {
    let duplicityEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'invokeDuplicity');
    if (duplicityEffect) await genericUtils.remove(duplicityEffect);
}
async function move({trigger, workflow}) {
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'trickstersTransposition');
    if (!feature) return;
    let selection = await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: feature.name}));
    if (selection) await workflowUtils.completeItemUse(feature);
}
async function added({trigger: {entity: item, actor}}) {
    let channelDivinity = itemUtils.getItemByIdentifier(actor, 'channelDivinity');
    if (!channelDivinity) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'summon', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].consumption.targets[0].target = channelDivinity.id;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: itemData.system.activities[activity.id].consumption.targets});
}
export let invokeDuplicity = {
    name: 'Invoke Duplicity',
    version: '1.3.15',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['summon']
            },
            {
                pass: 'rollFinished',
                macro: spell,
                priority: 50,
                activities: ['castSpells']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['dismiss']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['move']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        }
    ],
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.InvokeDuplicity',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'shadow',
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
export let invokeDuplicityDistract = {
    name: 'Invoke Duplicity: Distract',
    version: invokeDuplicity.version,
    rules: invokeDuplicity.rules,
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};