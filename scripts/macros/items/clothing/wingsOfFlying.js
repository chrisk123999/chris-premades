import {effectUtils, genericUtils, itemUtils, rollUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let effectData = {
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        name: workflow.item.name,
        img: workflow.item.img,
        changes: [
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: 60,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                wingsOfFlying: {
                    recharge: itemUtils.getConfig(workflow.item, 'recharge'),
                    name: workflow.item.name
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['wingsOfFlyingEffect']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'wingsOfFlyingEffect'});
}
async function end({trigger}) {
    let recharge = trigger.entity.flags['chris-premades']?.wingsOfFlying?.recharge;
    let name = trigger.entity.flags['chris-premades']?.wingsOfFlying?.name;
    if (!recharge || !name) return;
    let {roll} = await rollUtils.rollDice(recharge, {chatMessage: true});
    let effectData = {
        name: name + ': ' + genericUtils.translate('CHRISPREMADES.Generic.Disabled'),
        img: trigger.entity.img,
        origin: trigger.entity.origin,
        duration: {
            seconds: 3600 * roll.total
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['wingsOfFlyingRecharge']);
    await effectUtils.createEffect(trigger.entity.parent, effectData, {identifier: 'wingsOfFlyingRecharge'});
}
async function recharge({trigger}) {
    let item = await fromUuid(trigger.entity.origin);
    if (!item) return;
    await genericUtils.update(item, {'system.uses.value': Math.min(item.system.uses.value + 1, item.system.uses.max)});
}
export let wingsOfFlying = {
    name: 'Wings of Flying',
    version: '0.12.43',
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
            value: 'recharge',
            label: 'CHRISPREMADES.Generic.Recharge',
            type: 'text',
            default: '1d12',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let wingsOfFlyingEffect = {
    name: wingsOfFlying.name,
    version: wingsOfFlying.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};
export let wingsOfFlyingRecharge = {
    name: wingsOfFlying.name,
    version: wingsOfFlying.version,
    effect: [
        {
            pass: 'deleted',
            macro: recharge,
            priority: 50
        }
    ]
};