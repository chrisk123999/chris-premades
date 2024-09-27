import {effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let targetToken = workflow.hitTargets.first();
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'strengthDrain');
    let formula = config.formula;
    let drainRoll = await new Roll(formula).evaluate();
    drainRoll.toMessage({
        flavor: workflow.item.name,
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token})
    });
    let currStr = targetToken.actor.system.abilities.str.value;
    let actualChange = Math.min(currStr, drainRoll.total);
    let effect = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'strengthDrain').find(i => i.origin === workflow.item.uuid);
    if (effect) {
        let currDowngrade = parseInt(effect.changes[0].value);
        await genericUtils.update(effect, {changes: [{
            key: 'system.abilities.str.value',
            mode: 2,
            value: currDowngrade - actualChange,
            priority: 20
        }]});
    } else {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'system.abilities.str.value',
                    mode: 2,
                    value: -actualChange,
                    priority: 20
                }
            ]
        };
        if (config.shortRest) {
            effectData.flags = {
                dae: {
                    specialDuration: ['shortRest']
                }
            };
        } else if (config.longRest) {
            effectData.flags = {
                dae: {
                    specialDuration: ['longRest']
                }
            };
        }
        await effectUtils.createEffect(targetToken.actor, effectData, {identifier: 'strengthDrain'});
    }
    if (targetToken.actor.system.abilities.str.value) return;
    await effectUtils.applyConditions(targetToken.actor, ['dead'], {overlay: true});
}
export let strengthDrain = {
    name: 'Strength Drain',
    version: '0.12.83',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d4'
        },
        {
            value: 'shortRest',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.Short',
            type: 'checkbox',
            default: true
        },
        {
            value: 'longRest',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.Long',
            type: 'checkbox',
            default: true
        }
    ]
};