import {constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let targetToken = workflow.hitTargets.first();
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'abilityDrain');
    let ability = config.ability;
    let formula = config.formula;
    let checkSave = config.checkSave;
    if (checkSave && !workflow.failedSaves.size) return;
    let drainRoll = await new Roll(formula).evaluate();
    drainRoll.toMessage({
        flavor: workflow.item.name,
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token})
    });
    let currAbility = targetToken.actor.system.abilities[ability].value;
    let actualChange = Math.min(currAbility, drainRoll.total);
    let effect = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'abilityDrain').find(i => i.origin === workflow.item.uuid);
    if (effect) {
        let currDowngrade = parseInt(effect.changes[0].value);
        await genericUtils.update(effect, {changes: [{
            key: 'system.abilities.' + ability + '.value',
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
                    key: 'system.abilities.' + ability + '.value',
                    mode: 2,
                    value: -actualChange,
                    priority: 20
                }
            ],
            flags: {
                dae: {
                    showIcon: true
                }
            }
        };
        if (config.expire === 'short') {
            effectData.flags.dae.specialDuration = ['shortRest'];
        } else if (config.expire === 'long') {
            effectData.flags.dae.specialDuration = ['longRest'];
        }
        await effectUtils.createEffect(targetToken.actor, effectData, {identifier: 'abilityDrain'});
    }
    if (targetToken.actor.system.abilities[ability].value) return;
    await effectUtils.applyConditions(targetToken.actor, ['dead'], {overlay: true});
}
export let abilityDrain = {
    name: 'Ability Drain',
    translation: 'CHRISPREMADES.Macros.AbilityDrain.Name',
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
            value: 'expire',
            label: 'CHRISPREMADES.Config.Expire',
            type: 'select',
            default: 'short',
            options: [
                {
                    label: 'DND5E.REST.Short.Label',
                    value: 'short'
                },
                {
                    label: 'DND5E.REST.Long.Label',
                    value: 'long'
                },
                {
                    label: 'DND5E.USES.Recovery.Never',
                    value: 'never'
                }
            ]
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'str',
            options: constants.abilityOptions
        },
        {
            value: 'checkSave',
            label: 'CHRISPREMADES.Config.CheckSave',
            type: 'checkbox',
            default: true
        }
    ]
};