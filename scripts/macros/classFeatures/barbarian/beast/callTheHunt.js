import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size) return;
    let oldTargets = Array.from(workflow.targets);
    let maxTargets = Math.max(workflow.actor.system.abilities.con.mod, 1);
    if (workflow.targets.size > maxTargets) {
        let newTargets;
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.CallTheHunt.Select', {maxTargets}), oldTargets, {type: 'multiple', maxAmount: maxTargets});
        if (!selection?.length) {
            newTargets = oldTargets.slice(0, maxTargets);
        } else {
            newTargets = selection[0];
        }
        genericUtils.updateTargets(newTargets);
    }
}
async function late({workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let damageRoll = await new CONFIG.Dice.DamageRoll(workflow.targets.size * 5 + '[temphp]', {}, {type: 'temphp'}).evaluate();
    await workflowUtils.applyDamage([workflow.token], damageRoll.total, 'temphp');
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'flags.midi-qol.optional.CallTheHunt.damage.all',
                value: '1d6',
                mode: 5,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.CallTheHunt.count',
                value: 'turn',
                mode: 5,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.CallTheHunt.label',
                value: genericUtils.translate('CHRISPREMADES.Macros.CallTheHunt.Bonus'),
                mode: 5,
                priority: 20
            }
        ]
    };
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {parentEntity: effect, identifier: 'callTheHunt'});
    }
}
export let callTheHunt = {
    name: 'Call the Hunt',
    version: '0.12.20',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};