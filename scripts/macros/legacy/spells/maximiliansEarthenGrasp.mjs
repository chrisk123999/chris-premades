import {automationUtils, documentUtils, effectUtils, genericUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getGraspingEffect(actor) {
    return documentUtils.getEffectByIdentifier(actor, 'maximiliansEarthenGraspGrasping');
}
async function release(actor) {
    const effect = getGraspingEffect(actor);
    if (effect) await documentUtils.deleteDocument(effect);
}
function getHand(document) {
    return summonUtils.getSummonsBySource(document).find(summon => summon.token)?.token;
}
async function reach({document, workflow}) {
    if (workflow.activity.identifier !== 'maximilians-earthen-grasp-grasp') return;
    await release(workflow.actor);
    const hand = getHand(document);
    if (!hand) return;
    const range = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'followUpRange') || 5;
    const outOfReach = Array.from(workflow.targets).filter(token => tokenUtils.getDistance(hand, token.document) > range);
    if (!outOfReach.length) return;
    await workflowUtils.removeTargets(workflow, outOfReach);
    Logging.addMacroWarning('CPR', 'maximilians-earthen-grasp', 'CHRISPREMADES.Macros.Legacy.MaximiliansEarthenGrasp.OutOfReach', {notify: true});
}
async function aim({workflow}) {
    if (workflow.activity.identifier !== 'maximilians-earthen-grasp-crush') return;
    const targetUuid = getGraspingEffect(workflow.actor)?.flags['chris-premades']?.maximiliansEarthenGrasp?.targetUuid;
    const target = targetUuid ? fromUuidSync(targetUuid) : undefined;
    if (!target?.object) return Logging.addMacroWarning('CPR', 'maximilians-earthen-grasp', 'CHRISPREMADES.Macros.Legacy.MaximiliansEarthenGrasp.NoTarget', {notify: true});
    await workflowUtils.updateTargets(workflow, [target.object]);
}
async function grasp({document, workflow}) {
    if (workflow.activity.identifier !== 'maximilians-earthen-grasp-grasp') return;
    const target = workflow.failedSaves.first();
    if (!target) return;
    const targetEffect = documentUtils.getEffectByIdentifier(target.actor, 'maximiliansEarthenGraspRestrained', {multiple: true}).at(-1);
    if (!targetEffect) return Logging.addMacroWarning('CPR', 'maximilians-earthen-grasp', 'Restrained effect was not applied to the target.');
    const casterEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: _loc('CHRISPREMADES.Macros.Legacy.MaximiliansEarthenGrasp.Grasping'),
        img: document.img,
        origin: document.uuid,
        identifier: 'maximiliansEarthenGraspGrasping',
        activityUuid: workflow.activity.uuid,
        duration: {value: targetEffect.duration.value, units: targetEffect.duration.units},
        unhideActivities: ['maximilians-earthen-grasp-crush'],
        favoriteActivities: true
    });
    genericUtils.setProperty(casterEffectData, 'flags.chris-premades.maximiliansEarthenGrasp.targetUuid', target.document.uuid);
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [casterEffectData], {parentEntity: concentrationEffect});
    if (!casterEffect) return;
    await documentUtils.makeDependent(casterEffect, [targetEffect]);
    await documentUtils.makeDependent(targetEffect, [casterEffect]);
}
async function animate({document, workflow}) {
    const crush = workflow.activity.identifier === 'maximilians-earthen-grasp-crush';
    if (!crush && workflow.activity.identifier !== 'maximilians-earthen-grasp-grasp') return;
    const hand = getHand(document);
    const target = workflow.targets.first();
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!hand || !target || !animation?.macros?.play) return;
    await animation.macros.play(hand, target.document, {...options, crush, saved: !workflow.failedSaves.has(target)});
}
async function move({workflow}) {
    if (workflow.activity.identifier !== 'maximilians-earthen-grasp-move') return;
    await release(workflow.actor);
}
export const maximiliansEarthenGrasp = {
    name: 'Maximilian\'s Earthen Grasp',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemPreambleComplete', macro: reach, priority: 50},
        {pass: 'itemPreambleComplete', macro: aim, priority: 50},
        {pass: 'itemRollFinished', macro: animate, priority: 45},
        {pass: 'itemRollFinished', macro: grasp, priority: 50},
        {pass: 'itemRollFinished', macro: move, priority: 40}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'maximiliansEarthenGrasp'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
