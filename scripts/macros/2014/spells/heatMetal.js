import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (workflow.targets.size !== 1) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let targetToken = workflow.targets.first();
    let targetUuid = targetToken.document.uuid;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'heatMetalPulse', {strict: true});
    let damageFeature = activityUtils.getActivityByIdentifier(workflow.item, 'heatMetalDamage', {strict: true});
    if (!feature || !damageFeature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                heatMetal: {
                    targetUuid,
                    unable: false
                },
                castData: workflow.castData
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'heatMetal', 
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'heatMetal',
            activityIdentifier: 'heatMetalPulse'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['heatMetalPulse'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: casterEffectData.duration});
    await workflowUtils.syntheticActivityRoll(damageFeature, [targetToken], {atLevel: workflowUtils.getCastLevel(workflow)});
    await dialog(workflow, targetToken, effect);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'heatMetal');
    if (!effect) return;
    let targetTokenUuid = effect.flags['chris-premades'].heatMetal.targetUuid;
    let targetToken = fromUuidSync(targetTokenUuid)?.object;
    if (!targetToken) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'heatMetalDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [targetToken], {atLevel: effect.flags['chris-premades'].castData.castLevel});
    await dialog(workflow, targetToken, effect);
}
async function dialog(workflow, targetToken, effect) {
    let selection;
    if (!effect.flags['chris-premades'].heatMetal.unable) {
        selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.HeatMetal.Drop', [['CHRISPREMADES.Generic.Yes', true], ['CHRISPREMADES.Generic.No', false], ['CHRISPREMADES.Macros.HeatMetal.Unable', 'unable']], {userId: socketUtils.firstOwner(targetToken.actor, true)});
        if (selection === true) return; // Dropped
        if (selection === 'unable') {
            await genericUtils.update(effect, {'flags.chris-premades.heatMetal.unable': true});
        }
    } else {
        selection = 'unable';
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'heatMetalHeld', {strict: true});
    if (!feature) return;
    let heatMetalWorkflow = await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
    if (heatMetalWorkflow.failedSaves.size && !selection) {
        // Opted not to drop, but failed save (so dropped anyway)
        await ChatMessage.implementation.create({
            speaker: ChatMessage.implementation.getSpeaker({token: targetToken}),
            content: genericUtils.translate('CHRISPREMADES.Macros.HeatMetal.MustDrop')
        });
        return;
    }
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.HeatMetal.Held'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 12
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                value: 1,
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.all',
                value: 1,
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource'
                ],
            }
        }
    };
    await effectUtils.createEffect(targetToken.actor, effectData, {parentEntity: effect, identifier: 'heatMetalHeld'});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let heatMetal = {
    name: 'Heat Metal',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['heatMetal']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['heatMetalPulse']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['heatMetalPulse']
            }
        ]
    }
};