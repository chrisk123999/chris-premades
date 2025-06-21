import {dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let buttons = [
        ['CHRISPREMADES.Macros.GuardianOfNature.Beast', 'beast', {image: 'icons/creatures/abilities/bear-roar-bite-brown-green.webp'}],
        ['CHRISPREMADES.Macros.GuardianOfNature.Tree', 'tree', {image: 'icons/magic/nature/tree-animated-strike.webp'}]
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.GuardianOfNature.Select', buttons);
    if (!selection) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: []
    };
    if (selection === 'beast') {
        effectData.changes = [
            {
                key: 'system.attributes.movement.walk',
                mode: 2,
                value: '+' + genericUtils.handleMetric(10).toString(),
                priority: 20
            },
            {
                key: 'system.attributes.senses.darkvision',
                mode: 4,
                value: genericUtils.handleMetric(120),
                priority: 20
            },
            {
                key: 'ATL.dimSight',
                mode: 4,
                value: genericUtils.handleMetric(120),
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.attack.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '+1d6[force]',
                priority: 20
            }
        ];
    } else {
        effectData.changes = [
            {
                key: 'flags.midi-qol.advantage.ability.save.con',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.attack.dex',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.attack.wis',
                mode: 0,
                value: 1,
                priority: 20
            }
        ];
        if (workflow.token) await workflowUtils.applyDamage([workflow.token], 10, 'temphp');
    }
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
export let guardianOfNature = {
    name: 'Guardian of Nature',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};