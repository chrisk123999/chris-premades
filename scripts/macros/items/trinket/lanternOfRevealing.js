import {dialogUtils, effectUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let brightEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'lanternOfRevealingBright');
    let dimEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'lanternOfRevealingDim');
    let buttons = [];
    if (brightEffect) {
        buttons.push(
            ['CHRISPREMADES.Macros.LanternOfRevealing.Dim', 'dim'],
            ['CHRISPREMADES.Macros.LanternOfRevealing.Extinguish', 'extinguish']
        );
    } else if (dimEffect) {
        buttons.push(
            ['CHRISPREMADES.Macros.LanternOfRevealing.Bright', 'bright'],
            ['CHRISPREMADES.Macros.LanternOfRevealing.Extinguish', 'extinguish']
        );
    } else {
        buttons.push(
            ['CHRISPREMADES.Macros.LanternOfRevealing.Bright', 'bright'],
            ['CHRISPREMADES.Macros.LanternOfRevealing.Dim', 'dim']
        );
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.WhatDo', buttons);
    if (!selection) return;
    if (selection === 'dim') {
        if (brightEffect) await genericUtils.remove(brightEffect);
        let effectData = {
            name: workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Light.Dim') + ')',
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'ATL.light.dim',
                    mode: 4,
                    value: 5,
                    priority: 20
                }
            ]
        };
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'lanternOfRevealingDim', vae: [{type: 'use', name: workflow.item.name, identifier: 'lanternOfRevealing'}]});
        return;
    } else if (selection === 'bright') {
        if (dimEffect) await genericUtils.remove(dimEffect);
        let effectData = {
            name: workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Light.Bright') + ')',
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'ATL.light.bright',
                    mode: 4,
                    value: 30,
                    priority: 20
                },
                {
                    key: 'ATL.light.dim',
                    mode: 4,
                    value: 60,
                    priority: 20
                }
            ]
        };
        effectUtils.addMacro(effectData, 'aura', ['lanternOfRevealing']);
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'lanternOfRevealingBright', vae: [{type: 'use', name: workflow.item.name, identifier: 'lanternOfRevealing'}]});
        return;
    } else {
        if (brightEffect) await genericUtils.remove(brightEffect);
        if (dimEffect) await genericUtils.remove(dimEffect);
    }
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let isInvisible = effectUtils.getEffectByStatusID(target.actor, 'invisible');
    if (!isInvisible) return;
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let effectData = {
        name: effect.name,
        img: effect.img,
        origin: effect.uuid,
        changes: [
            {
                key: 'system.traits.ci.value',
                mode: 2,
                value: 'invisible',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                aura: true
            },
            dae: {
                showIcon: true
            }
        }
    };
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
export let lanternOfRevealing = {
    name: 'Lantern of Revealing',
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
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'lanternOfRevealingAura'
        }
    ]
};