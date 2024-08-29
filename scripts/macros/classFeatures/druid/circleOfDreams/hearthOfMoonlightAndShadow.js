import {effectUtils, genericUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (!workflow.template) return;
    let templateEffectName = genericUtils.format('CHRISPREMADES.GenericEffects.TemplateEffect', {itemName: workflow.item.name});
    let templateEffect = workflow.actor.effects.getName(templateEffectName);
    if (templateEffect) {
        await genericUtils.setFlag(templateEffect, 'dae', 'specialDuration', ['shortRest', 'longRest']);
    } else {
        let effectData = {
            name: templateEffectName,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            flags: {
                dnd5e: {
                    dependents: [{uuid: workflow.template.uuid}]
                },
                dae: {
                    specialDuration: [
                        'shortRest',
                        'longRest'
                    ]
                }
            }
        };
        await effectUtils.createEffect(workflow.actor, effectData);
    }
}
export let hearthOfMoonlightAndShadow = {
    name: 'Hearth of Moonlight and Shadow',
    version: '0.12.41',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};