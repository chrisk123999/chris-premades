import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let storming = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.CallLightning.Storming');
    let castLevel = workflowUtils.getCastLevel(workflow);
    if (storming) castLevel += 1;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'stormBolt', {strict: true});
    if (!feature) {
        let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
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
                castData: {
                    castLevel
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
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
    await workflowUtils.completeActivityUse(feature);
}
async function early({actor, config, dialog}) {
    dialog.configure = false;
    let effect = effectUtils.getEffectByIdentifier(actor, 'callLightning');
    if (!effect) return true;
    let spellLabel = actorUtils.getEquivalentSpellSlotName(actor, effect.flags['chris-premades'].castData.castLevel);
    if (spellLabel) config.spell = {slot: spellLabel};
}
export let callLightning = {
    name: 'Call Lightning',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['callLightning']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['stormBolt']
            }
        ]
    }
};