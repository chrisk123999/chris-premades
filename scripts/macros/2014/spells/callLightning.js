import {activityUtils, actorUtils, animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let storming = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.CallLightning.Storming');
    let castLevel = workflowUtils.getCastLevel(workflow);
    if (storming) castLevel += 1;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'stormBolt', {strict: true});
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!feature) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: concentrationEffect?.uuid ?? workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                castData: {
                    castLevel
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'callLightning', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'callLightning', 
            activityIdentifier: 'stormBolt'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['stormBolt'],
            favorite: true
        }
    });
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) animation(workflow, effect);
    await workflowUtils.completeActivityUse(feature);
}
async function early({actor, config, dialog}) {
    dialog.configure = false;
    let effect = effectUtils.getEffectByIdentifier(actor, 'callLightning');
    if (!effect) return true;
    let spellLabel = actorUtils.getEquivalentSpellSlotName(actor, effect.flags['chris-premades'].castData.castLevel);
    if (spellLabel) config.spell = {slot: spellLabel};
}
async function handleTemplates({workflow}) {
    if (!workflow.template) return;
    if (activityUtils.getIdentifier(workflow.activity) === 'callLightning' && itemUtils.getConfig(workflow.item, 'keepTemplate')) return;
    await genericUtils.remove(workflow.template);
}
function animation(workflow, dependent) {
    if (!animationUtils.sequencerCheck() || !['patreon', 'free'].includes(animationUtils.jb2aCheck())) return;
    /* eslint-disable indent */
    new Sequence()
        .effect(itemUtils.getConfig(workflow.item, 'animationColor'))
            .atLocation(workflow.template)
            .tieToDocuments(dependent)
            .scaleToObject()
            .randomSpriteRotation()
            .belowTokens()
            .opacity(0.7)
            .fadeIn(200)
            .fadeOut(200)
            .persist()
        .play();
    /* eslint-enable indent */
} 
export let callLightning = {
    name: 'Call Lightning',
    version: '1.5.36',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['callLightning']
            },
            {
                pass: 'rollFinished',
                macro: handleTemplates,
                priority: 500
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['stormBolt']
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
            value: 'animationColor',
            label: 'CHRISPREMADES.Config.Color',
            category: 'animation',
            type: 'select',
            default: 'jb2a.call_lightning.high_res.blueorange',
            options: [
                {
                    value: 'jb2a.call_lightning.high_res.blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value: 'jb2a.call_lightning.high_res.yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow'
                },
                {
                    value: 'jb2a.call_lightning.high_res.blueorange',
                    label: 'CHRISPREMADES.Config.Colors.BlueOrange'
                },
                {
                    value: 'jb2a.call_lightning.high_res.purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple'
                },
                {
                    value: 'jb2a.call_lightning.high_res.red',
                    label: 'CHRISPREMADES.Config.Colors.Red'
                },
                {
                    value: 'jb2a.call_lightning.low_res.green',
                    label: 'CHRISPREMADES.Config.Colors.Green'
                },
                {
                    value: 'jb2a.call_lightning.low_res.pinkyellow',
                    label: 'CHRISPREMADES.Config.Colors.PinkYellow'
                }
            ]
        },
        {
            value: 'keepTemplate',
            label: 'CHRISPREMADES.Config.KeepTemplate',
            type: 'checkbox',
            default: true,
            category: 'visuals'
        }
    ]
};