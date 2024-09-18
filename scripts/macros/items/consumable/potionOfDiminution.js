import {effectUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let roll = await new Roll('1d4').evaluate();
    roll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: {
            seconds: 3600 * roll.total
        },
        changes: [
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '-1d4',
                priority: 20
            },
            {
                key: 'system.bonuses.rwak.damage',
                mode: 2,
                value: '-1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ], 
        flags: {
            'chris-premades': {
                enlargeReduce: {
                    selection: 'reduce',
                    playAnimation
                },
                effect: {
                    sizeAnimation: false
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
    let targetSize = actor.system.traits.size;
    let newSize = targetSize;
    switch (targetSize) {
        case 'sm':
            newSize = 'tiny';
            break;
        case 'med':
            newSize = 'sm';
            break;
        case 'lg':
            newSize = 'med';
            break;
        case 'huge':
            newSize = 'lg';
            break;
        case 'grg':
            newSize = 'huge';
            break;
    }
    effectData.flags['chris-premades'].enlargeReduce.origSize = targetSize;
    effectData.flags['chris-premades'].enlargeReduce.newSize = newSize;
    await effectUtils.createEffect(actor, effectData, {identifier: 'potionOfDiminution'});
}
export let potionOfDiminution = {
    name: 'Potion of Diminution',
    version: '0.12.70',
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
        }
    ]
};