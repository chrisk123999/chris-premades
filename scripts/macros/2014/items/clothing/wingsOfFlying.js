import {effectUtils, genericUtils, itemUtils, rollUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let effectData = {
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        name: workflow.item.name,
        img: workflow.item.img,
        changes: [
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: genericUtils.handleMetric(60),
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
    let item = await effectUtils.getOriginItem(trigger.entity);
    if (!item) return;
    await genericUtils.update(item, {'system.uses.spent': Math.max(item.system.uses.spent - 1, 0)});
}
export let wingsOfFlying = {
    name: 'Wings of Flying',
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