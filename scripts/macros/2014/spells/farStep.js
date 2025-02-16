import {Teleport} from '../../../lib/teleport.js';
import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let anim = 'none';
    if (playAnimation && animationUtils.jb2aCheck()) {
        anim = 'mistyStep';
        if (animation === 'complex' && animationUtils.jb2aCheck() === 'patreon') anim = 'farStep';
    }
    await Teleport.target([workflow.token], workflow.token, {range: 60, animation: anim});
    if (anim === 'farStep') {
        new Sequence()
            .effect()
            .file('jb2a.token_border.circle.spinning.blue.001')
            .name('Far Step')
            .scaleIn(0, 1000, {ease: 'easeOutElastic'})
            .persist()
            .scaleOut(0, 500, {ease: 'easeOutElastic'})
            .atLocation(workflow.token)
            .attachTo(workflow.token, {bindAlpha: false})
            .scaleToObject(2)
            .play();
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'farStepTeleport', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                farStep: {
                    playAnimation,
                    animation,
                    hasPersistent: anim === 'farStep'
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['farStepStepping']);
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'farStep', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'farStep',
            activityIdentifier: 'farStepTeleport'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['farStepTeleport'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'farStep');
    let {playAnimation, animation} = effect.flags['chris-premades'].farStep;
    let anim = 'none';
    if (playAnimation && animationUtils.jb2aCheck()) {
        anim = 'mistyStep';
        if (animation === 'complex' && animationUtils.jb2aCheck() === 'patreon') anim = 'farStep';
    }
    await Teleport.target([workflow.token], workflow.token, {range: 60, animation: anim});
}
async function end({trigger: {entity: effect}}) {
    let removeAnim = effect.flags['chris-premades'].farStep.hasPersistent;
    if (!removeAnim) return;
    let token = actorUtils.getFirstToken(effect.parent);
    await Sequencer.EffectManager.endEffects({name: 'Far Step', object: token});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let farStep = {
    name: 'Far Step',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['farStep']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['farStepTeleport']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['farStepTeleport']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'simple',
            category: 'animation',
            options: [
                {
                    value: 'simple',
                    label: 'CHRISPREMADES.Config.Animations.Simple',
                },
                {
                    value: 'complex',
                    label: 'CHRISPREMADES.Config.Animations.Complex',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};
export let farStepStepping = {
    name: 'Far Step: Stepping',
    version: farStep.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};