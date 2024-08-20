import {effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function misfire({trigger, workflow}) {
    if (!workflow.item) return;
    let baseItem = workflow.item.system.type?.baseItem;
    if (baseItem != 'firearm') return;
    let proficient = workflow.item.system.proficient || workflow.actor.system.traits.weaponProf.value.has(baseItem) || workflow.actor.system.traits.weaponProf.value.has('oth');
    let misfireScore = itemUtils.getConfig(workflow.item, 'misfireScore') ?? 1;
    if (!proficient) misfireScore += 1;
    if (workflow.attackRoll.terms[0].total > misfireScore) return;
    await ChatMessage.create({
        speaker: {alias: name},
        content: workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Firearm.HasMisfired')
    });
    if (workflow.item.id) {
        await itemUtils.setConfig(workflow.item, 'status', 1);
    }
    let effectData = {
        img: 'icons/magic/time/arrows-circling-green.webp',
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        name: genericUtils.translate('CHRISPREMADES.Firearm.Misfire'),
        changes: [
            {
                key: 'flags.midi-qol.fail.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Attack'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}