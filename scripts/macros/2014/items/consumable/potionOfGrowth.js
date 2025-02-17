import {effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function use({workflow}) {
    let token = workflow.targets.first() ?? workflow.token;
    let actor = token.actor;
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
                value: '+1d4',
                priority: 20
            },
            {
                key: 'system.bonuses.rwak.damage',
                mode: 2,
                value: '+1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ], 
        flags: {
            'chris-premades': {
                enlargeReduce: {
                    selection: 'enlarge',
                    playAnimation
                },
                effect: {
                    sizeAnimation: false
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['enlargeReduceChanged']);
    let doGrow = true;
    let targetSize = actor.system.traits.size;
    if (targetSize !== 'tiny' && targetSize !== 'sm') {
        let room = tokenUtils.checkForRoom(token, 1);
        let direction = tokenUtils.findDirection(room);
        if (direction === 'none') doGrow = false;
    }
    let newSize = targetSize;
    if (doGrow) {
        switch (targetSize) {
            case 'tiny':
                newSize = 'sm';
                break;
            case 'sm':
                newSize = 'med';
                break;
            case 'med':
                newSize = 'lg';
                break;
            case 'lg':
                newSize = 'huge';
                break;
            case 'huge':
                newSize = 'grg';
                break;
        }
    }
    effectData.flags['chris-premades'].enlargeReduce.origSize = targetSize;
    effectData.flags['chris-premades'].enlargeReduce.newSize = newSize;
    await effectUtils.createEffect(actor, effectData, {identifier: 'potionOfGrowth'});
}
export let potionOfGrowth = {
    name: 'Potion of Growth',
    version: '1.1.0',
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