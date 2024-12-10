import {activityUtils, constants, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: 'radiant',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['shadowOfMoilBuffed']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'shadowOfMoil'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function early({workflow}) {
    let sourceToken = workflow.token;
    let sourceActor = workflow.actor;
    let sourceEffect = effectUtils.getEffectByIdentifier(sourceActor, 'shadowOfMoil');
    let sourceSenses = sourceActor.system.attributes.senses;
    for (let targetToken of workflow.targets) {
        let targetActor = targetToken.actor;
        let targetEffect = effectUtils.getEffectByIdentifier(targetActor, 'shadowOfMoil');
        if (!sourceEffect && !targetEffect) continue;
        let distance = tokenUtils.getDistance(sourceToken, targetToken);
        let sourceCanSeeTarget = false;
        let targetCanSeeSource = false;
        if (sourceEffect && !targetEffect) sourceCanSeeTarget = true;
        if (targetEffect && !sourceEffect) targetCanSeeSource = true;
        let targetSenses = targetActor.system.attributes.senses;
        if ((sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance)) sourceCanSeeTarget = true;
        if ((targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance)) targetCanSeeSource = true;
        if (sourceCanSeeTarget && targetCanSeeSource) continue;
        if (sourceCanSeeTarget) {
            workflow.advantage = true;
            workflow.attackAdvAttribution.add(sourceEffect.name + ': ' + genericUtils.translate('CHRISPREMADES.Template.TargetCantSeeAttacker'));
        } else if (targetCanSeeSource) {
            workflow.disadvantage = true;
            workflow.flankingAdvantage = false;
            workflow.attackAdvAttribution.add(targetEffect.name + ': ' + genericUtils.translate('CHRISPREMADES.Template.AttackerCantSeeTarget'));
        } else {
            workflow.advantage = true;
            workflow.disadvantage = true;
            workflow.attackAdvAttribution.add(sourceEffect.name + ': ' + genericUtils.translate('CHRISPREMADES.Template.TargetCantSeeAttacker'));
            workflow.attackAdvAttribution.add(sourceEffect.name + ': ' + genericUtils.translate('CHRISPREMADES.Template.AttackerCantSeeTarget'));
        }
    }
}
async function onHit({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let distance = tokenUtils.getDistance(workflow.token, trigger.token);
    if (distance > 10) return;
    let effect = effectUtils.getEffectByIdentifier(trigger.token.actor, 'shadowOfMoil');
    if (!effect) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'shadowOfMoilDamage', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token]);
}
export let shadowOfMoil = {
    name: 'Shadow of Moil',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['shadowOfMoil']
            }
        ]
    }
};
export let shadowOfMoilBuffed = {
    name: 'Shadow of Moil: Buffed',
    version: shadowOfMoil.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: onHit,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'targetPreambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};