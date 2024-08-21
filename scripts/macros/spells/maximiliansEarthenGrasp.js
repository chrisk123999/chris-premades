import {Summons} from '../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Earthen Hand');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = 'Earthen Hand';
    let updates = {
        actor: {
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
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'earth';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Maximilian\'s Earthen Grasp: Grasp', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MaximiliansEarthenGrasp.Grasp', identifier: 'maximiliansEarthenGraspGrasp', flatDC: itemUtils.getSaveDC(workflow.item)});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 60,
        range: 30,
        animation,
        initiativeType: 'none',
        additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'maximiliansEarthenGraspGrasp'}]
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'maximiliansEarthenGrasp');
    if (!casterEffect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: casterEffect});
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'maximiliansEarthenGraspGrasp');
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await workflowUtils.completeItemUse(feature);
}
async function early({workflow}) {
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'maximiliansEarthenGrasp');
    let summonedToken = canvas.scene.tokens.get(casterEffect?.flags['chris-premades'].summons.ids[casterEffect?.name][0]);
    let summonedActor = summonedToken?.actor;
    if (!summonedActor) return;
    if (genericUtils.getIdentifier(workflow.item) === 'maximiliansEarthenGraspGrasp') {
        let graspEffect = itemUtils.getItemByIdentifier(summonedActor, 'maximiliansEarthenGraspGrasp');
        if (graspEffect) await genericUtils.remove(graspEffect);
        let target;
        let nearbyTargets = tokenUtils.findNearby(summonedToken, 5, 'enemy', {includeIncapacitated: true});
        if (!nearbyTargets.length) {
            genericUtils.notify('CHRISPREMADES.Macros.MaximiliansEarthenGrasp.NoNearby', 'info');
            return;
        } else if (nearbyTargets.length === 1) {
            target = nearbyTargets[0];
        } else {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.MaximiliansEarthenGrasp.Select', nearbyTargets);
            if (!selection?.length) return;
            target = selection[0];
        }
        genericUtils.updateTargets([target]);
    } else {
        let target = await fromUuid(workflow.item.flags['chris-premades'].maximiliansEarthenGrasp.targetUuid);
        if (!target) return;
        genericUtils.updateTargets([target.object]);
    }
}
async function late({workflow}) {
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'maximiliansEarthenGrasp');
    if (genericUtils.getIdentifier(workflow.item) !== 'maximiliansEarthenGraspGrasp') return;
    if (!workflow.failedSaves.size) return;
    let target = workflow.failedSaves.first();
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Maximilian\'s Earthen Grasp: Crush', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MaximiliansEarthenGrasp.Crush', identifier: 'maximiliansEarthenGraspCrush', flatDC: itemUtils.getSaveDC(workflow.item)});
    genericUtils.setProperty(featureData, 'flags.chris-premades.maximiliansEarthenGrasp.targetUuid', target.document.uuid);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: casterEffect, identifier: 'maximiliansEarthenGraspGrasping', vae: [{type: 'use', name: featureData.name, identifier: 'maximiliansEarthenGraspCrush'}]});
    if (!effect) return;
    // TODO: also add one to the summon & make it come off if it moves?
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: effect});
    genericUtils.setProperty(effectData, 'flags.chris-premades.conditions', ['restrained']);
    effectData.changes = [
        {
            key: 'flags.midi-qol.OverTime',
            mode: 0,
            value: 'turn=start,label=' + genericUtils.translate('CHRISPREMADES.Macros.MaximiliansEarthenGrasp.Overtime') + ',allowIncapacitated=true,rollType=check,saveDC=' + itemUtils.getSaveDC(workflow.item) + ',saveDamage=nodamage,saveAbility=str,saveRemove=true,actionSave=true,rollMode=publicroll',
            priority: 20
        }
    ];
    await effectUtils.createEffect(target.actor, effectData, {parentEntity: effect, strictlyInterdependent: true});
}
export let maximiliansEarthenGrasp = {
    name: 'Maximilian\'s Earthen Grasp',
    version: '0.12.7',
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
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.EarthenHand',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.EarthenHand',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.EarthenHand',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ]
};
export let maximiliansEarthenGraspGrasping = {
    name: 'Maximilian\'s Earthen Grasp: Grasping',
    version: maximiliansEarthenGrasp.version,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};