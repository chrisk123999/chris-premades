import {actorUtils, effectUtils, genericUtils} from '../../utils.js';
import {upcastTargets} from '../generic/upcastTargets.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 5,
                value: 'label=' + genericUtils.translate('CHRISPREMADES.macros.holdPerson.overtime') + ',turn=end,saveDC=@item.save.dc,saveAbility=wis,savingThrow=true,saveMagic=true',
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'mantle-of-madness',
                priority: 20
            }
        ],
        // TODO: Put in the change equivalent of the flag? Dunno
        flags: {
            'chris-premades': {
                conditions: ['paralyzed']
            }
        }
    };
    for (let token of workflow.failedSaves) {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'holdPersonHeld'});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function early({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await upcastTargets.plusOne({workflow});
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.genericEffects.invalidTarget'),
        img: 'icons/magic/time/arrows-circling-green.webp',
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 99,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    for (let target of workflow.targets) {
        if (actorUtils.typeOrRace(target.actor) !== 'humanoid' && target.targeted.has(game.user)) await effectUtils.createEffect(target.actor, effectData, {identifier: 'holdPersonInvalidTarget'});
    }
}
export let holdPerson = {
    name: 'Hold Person',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};