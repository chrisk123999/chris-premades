import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Forest Guard');
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
                'chris-premades': {
                    forestGuard: {
                        ownerUuid: workflow.actor.uuid
                    }
                }
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
        initiativeType: 'none',
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['attack'],
                favorite: true
            }
        ]
    });
    let spawnedToken = spawnedTokens?.[0];
    if (!spawnedToken) return;
    let effect = effectUtils.getEffectByIdentifier(spawnedToken.actor, 'summonedEffect');
    if (!effect) return;
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'forestGuard');
    if (!casterEffect) return;
    await genericUtils.setFlag(casterEffect, 'chris-premades', 'macros.combat', ['forestGuardTurnEffect']);
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.movement', ['forestGuardEffect']);
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.combat', ['forestGuardEffect']);
}
async function attack({trigger, workflow}) {
    let nearbyBushes = tokenUtils.findNearby(workflow.targets.first(), 10, 'ally').find(token => token.actor.flags['chris-premades']?.forestGuard?.ownerUuid === workflow.actor.uuid);
    if (nearbyBushes) return;
    workflow.aborted = true;
    genericUtils.notify('CHRISPREMADES.Macros.ForestGuard.NoShrub', 'warn', {localize: true});
}
async function removed({trigger: {entity: {effect}}}) {
    let effects = effectUtils.getAllEffectsByIdentifier(effect.parent, 'forestGuardEffect');
    if (effects.length > 1) return;
    let unhideEffect = effectUtils.getEffectByIdentifier(effect.parent, 'forestGuardUnhideEffect');
    if (!unhideEffect) return;
    await genericUtils.remove(unhideEffect);
}
async function moveOrStart({trigger: {entity: effect, token, target}}) {
    let attackedTokenUuids = effect.flags['chris-premades']?.forestGuard?.tokenUuids ?? [];
    if (combatUtils.inCombat() && attackedTokenUuids.includes(target.document.uuid)) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let moveOrStartAttack = activityUtils.getActivityByIdentifier(originItem, 'moveOrStart', {strict: true});
    if (!moveOrStartAttack) return;
    let sourceEffect = itemUtils.getEffectByIdentifier(originItem, 'forestGuardRangeEffect');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    let originRangeEffect = await effectUtils.createEffect(originItem.actor, effectData);
    let rangeEffect = await effectUtils.createEffect(token.actor, effectData, {animate: false});
    let hasUsedReaction = actorUtils.hasUsedReaction(originItem.actor); //Is there a way to fix this?
    await workflowUtils.syntheticActivityRoll(moveOrStartAttack, [target]);
    if (!hasUsedReaction) {
        await actorUtils.removeReactionUsed(originItem.actor, true);
    }
    await genericUtils.remove(originRangeEffect);
    await genericUtils.remove(rangeEffect);
    attackedTokenUuids.push(target.document.uuid);
    if (combatUtils.inCombat()) await genericUtils.setFlag(effect, 'chris-premades', 'forestGuard.tokenUuids', attackedTokenUuids);
}
async function endTurn({trigger: {entity: effect}}) {
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let tokens = [];
    for (let i of effect.flags['chris-premades'].summons.scenes[originItem.name]) {
        let scene = game.scenes.get(i);
        if (!scene) continue;
        for (let j of effect.flags['chris-premades'].summons.ids[originItem.name]) {
            let token = scene.tokens.get(j);
            if (token) tokens.push(token);
        }
    }
    for (let token of tokens) {
        let summonEffect = effectUtils.getEffectByIdentifier(token.actor, 'summonedEffect');
        if (!summonEffect) continue;
        await genericUtils.setFlag(summonEffect, 'chris-premades', 'forestGuard.tokenUuids', []);
    }
}
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let nearbyBushes = tokenUtils.findNearby(workflow.hitTargets.first(), 10, 'enemy').filter(token => token.actor.flags['chris-premades']?.forestGuard?.ownerUuid === workflow.actor.uuid);
    if (nearbyBushes.length <= 1) return;
    await workflowUtils.bonusDamage(workflow, nearbyBushes.length - 1 + 'd4');
}
export let forestGuard = {
    name: 'Forest Guard',
    version: '1.3.114',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50,
                activities: ['attack']
            },
            {
                pass: 'targetPreItemRoll',
                macro: attack,
                priority: 50,
                activities: ['attack']
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ForestGuard',
            type: 'text',
            default: '',
            category: 'summons'
        },
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
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ForestGuard',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ForestGuard',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let forestGuardTurnEffect = {
    name: 'Forest Guard: Turn Effect',
    version: forestGuard.version,
    rules: forestGuard.rules,
    combat: [
        {
            pass: 'everyTurn',
            macro: endTurn,
            priority: 50
        }
    ]
};
export let forestGuardEffect = {
    name: 'Forest Guard: Effect',
    version: forestGuard.version,
    rules: forestGuard.rules,
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrStart,
            distance: 10,
            priority: 50,
            disposition: 'enemy'
        }
    ],
    combat: [
        {
            pass: 'turnStartNear',
            macro: moveOrStart,
            distance: 10,
            priority: 50,
            disposition: 'enemy'
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};