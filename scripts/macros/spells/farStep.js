import {Teleport} from '../../lib/teleport.js';
import {actorUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

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
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Far Step: Teleport', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FarStep.Teleport', identifier: 'farStepTeleport'});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'farStep', vae: [{type: 'use', name: featureData.name, identifier: 'farStepTeleport'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function useBonus({workflow}) {
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
export let farStep = {
    name: 'Far Step',
    version: '0.12.0',
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
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useBonus,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};