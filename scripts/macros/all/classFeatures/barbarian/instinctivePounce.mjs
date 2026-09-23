import {animationUtils, automationUtils, crosshairUtils, dialogUtils, documentUtils, effectUtils, genericUtils, workflowUtils} from '../../../../proxy.mjs';
async function prompt({document: activity}) {
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.completeActivityUse(activity);
}
async function pounce({workflow}) {
    const animationSetting = automationUtils.getConfigValue(workflow.item, 'animation');
    const animation = animationUtils.getAnimation(animationSetting);
    const maxRange = Math.floor(0.1 * workflow.actor.system.attributes.movement.speed) * 5;
    if (!maxRange) return;
    if (!animation) return await simplePounce(workflow, maxRange);
    const position = await crosshairUtils.aimCrosshair({token: workflow.token.document, maxRange});
    animation.macros.play(position, workflow.token);
}
async function simplePounce(workflow, movement) {
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {duration: {seconds: 1}});
    genericUtils.setProperty(effectData, 'system.changes.0.value', movement);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const instinctivePounce = {
    name: 'Instinctive Pounce',
    version: '2.0.4',
    rules: 'all',
    called: [
        {
            pass: 'actorRageBegin',
            macro: prompt,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: pounce,
            priority: 50
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'instinctivePounce'
            },
            type: 'selectAnimation',
            inputs: ['position', 'sourceToken'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        }
    }
};
