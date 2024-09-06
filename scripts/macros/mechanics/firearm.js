import {constants, effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function misfire({trigger, workflow}) {
    let baseItem = workflow.item.system.type?.baseItem;
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
        img: constants.tempConditionIcon,
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
async function status({trigger, workflow}) {
    let status = Number(itemUtils.getConfig(workflow.item, 'status'));
    switch (status) {
        default: return;
        case 1:
            genericUtils.notify('CHRISPREMADES.Firearm.IsDamaged', 'warn');
            return true;
        case 2:
            genericUtils.notify('CHRISPREMADES.Firearm.IsBroken', 'warn');
            return true;
    }
}
export let firearm = {
    name: 'Firearm',
    version: '0.12.26',
    midi: {
        item: [
            {
                pass: 'postAttackRoll',
                macro: misfire,
                priority: 10
            },
            {
                pass: 'preItemRoll',
                macro: status,
                priority: 10
            }
        ]
    },
    config: [
        {
            value: 'status',
            label: 'CHRISPREMADES.Firearm.Status',
            type: 'select',
            options: [
                {
                    value: 0,
                    label: 'CHRISPREMADES.Firearm.Undamaged'
                },
                {
                    value: 1,
                    label: 'CHRISPREMADES.Firearm.Damaged'
                },
                {
                    value: 2,
                    label: 'CHRISPREMADES.Firearm.Broken'
                },
            ],
            default: 0,
            category: 'mechanics'
        }
    ]
};