import {effectUtils, genericUtils, rollUtils} from '../../../../utils.js';

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
    await genericUtils.update(workflow.template, {
        flags: {
            'chris-premades': {
                castData: {
                    castLevel: 0,
                    baseLevel: 0,
                    saveDC: 0
                },
                template: {
                    name: workflow.item.name
                },
                macros: {
                    skill: ['hearthOfMoonlightAndShadow']
                }
            }
        }
    });
}
async function skillBonus({trigger: {skillId, roll}}) {
    if (!['prc', 'ste'].includes(skillId)) return;
    return await rollUtils.addToRoll(roll, '+5');
}
export let hearthOfMoonlightAndShadow = {
    name: 'Hearth of Moonlight and Shadow',
    version: '1.0.37',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    skill: [
        {
            pass: 'bonus',
            macro: skillBonus,
            priority: 50
        }
    ]
};