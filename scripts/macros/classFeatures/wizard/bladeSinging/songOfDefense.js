import {actorUtils, dialogUtils, effectUtils, genericUtils} from '../../../../utils.js';

async function use({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bladesong');
    if (!effect) {
        genericUtils.notify('CHRISPREMADES.Macros.SongOfDefense.Bladesong', 'warn');
        return;
    }
    if (!actorUtils.hasSpellSlots(workflow.actor)) {
        genericUtils.notify('CHRISPREMADES.Macros.SongOfDefense.NoSpellSlots', 'warn');
        return;
    }
    let selection = await dialogUtils.selectSpellSlot(workflow.actor, workflow.item.name, 'CHRISPREMADES.Generic.SelectSpellSlot');
    if (!selection) return;
    let damageReduction;
    if (selection === 'pact') {
        await genericUtils.update(workflow.actor, {'system.spells.pact.value': workflow.actor.system.spells.pact.value - 1});
        damageReduction = workflow.actor.system.spells.pact.level * 5;
    } else {
        await genericUtils.update(workflow.actor, {['system.spells.spell' + selection]: workflow.actor.system.spells['spell' + selection].value - 1});
        damageReduction = selection * 5;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.DR.all',
                mode: 0,
                value: damageReduction,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Reaction'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}


export let songOfDefense = {
    name: 'Song of Defense',
    version: '0.12.9'
};