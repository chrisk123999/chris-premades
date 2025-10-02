import {Summons} from '../../../lib/summons.js';
import {Teleport} from '../../../lib/teleport.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Feywild Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflowUtils.getCastLevel(workflow);
    let teleportFeature = activityUtils.getActivityByIdentifier(workflow.item, 'conjureFeyTeleport', {strict: true});
    if (!teleportFeature) return;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = sourceActor.name;
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
    let [spawnedToken=null] = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds,
        range: workflow.item.system.range.value,
        animation,
        initiativeType: 'follows',
        additionalVaeButtons: [{
            type: 'use',
            name: teleportFeature.name,
            identifier: 'conjureFey',
            activityIdentifier: 'conjureFeyTeleport'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['conjureFeyTeleport'],
            favorite: true
        }
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'conjureFey');
    if (!spawnedToken || !casterEffect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(casterEffect, {'flags.chris-premades.castData': workflow.castData});
    await attackHelper(workflow.token, spawnedToken, workflow.item, spellLevel);
}
async function teleport({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'conjureFey');
    if (!effect) return;
    let summonToken = canvas?.scene?.tokens.get(effect.flags['chris-premades']?.summons?.ids[effect.name][0]);
    if (!summonToken) return;
    await Teleport.target([summonToken.object], workflow.token, {range: 30, animation: 'mistyStep', centerpoint: summonToken.object.center});
    await attackHelper(workflow.token, summonToken, workflow.item, effect.flags['chris-premades'].castData.castLevel);
}
async function attackHelper(sourceToken, summonToken, sourceItem, spellLevel) {
    let nearbyTargets = tokenUtils.findNearby(summonToken, 5, 'enemy').filter(t => tokenUtils.canSee(sourceToken, t));
    if (!nearbyTargets.length) return;
    let attackFeature = activityUtils.getActivityByIdentifier(sourceItem, 'conjureFeyAttack', {strict: true});
    if (!attackFeature) return;
    let target;
    if (nearbyTargets.length === 1) {
        target = nearbyTargets[0];
    } else {
        target = await dialogUtils.selectTargetDialog(attackFeature.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Select', nearbyTargets);
        if (!target?.length) return;
        target = target[0];
    }
    if (!target) return;
    let attackWorkflow = await workflowUtils.syntheticActivityRoll(attackFeature, [target], {atLevel: spellLevel});
    if (!attackWorkflow.hitTargets.size) return;
}
async function early({dialog}) {
    dialog.configure = false;
}
export let conjureFey = {
    name: 'Conjure Fey',
    version: '1.3.84',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['conjureFey']
            },
            {
                pass: 'rollFinished',
                macro: teleport,
                priority: 50,
                activities: ['conjureFeyTeleport']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['conjureFeyTeleport']
            }
        ]
    },
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeywildSpirit',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeywildSpirit',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeywildSpirit',
            type: 'file',
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
        }
    ]
};