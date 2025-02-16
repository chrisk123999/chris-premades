import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.BolsteringMagic.Select', [
        ['CHRISPREMADES.Macros.BolsteringMagic.Bonus', 'd3'],
        ['CHRISPREMADES.Macros.BolsteringMagic.Regain', 'spell']
    ]);
    if (!selection) return;
    if (selection === 'd3') {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 600
            },
            changes: [
                {
                    key: 'system.bonuses.All-Attacks',
                    mode: 2,
                    value: '1d3',
                    priority: 20
                },
                {
                    key: 'system.bonuses.abilities.check',
                    mode: 2,
                    value: '1d3',
                    priority: 20
                }
            ]
        };
        await effectUtils.createEffect(targetActor, effectData, {identifier: 'bolsteringMagicBuff'});
    } else {
        let roll = await new Roll('1d3').evaluate();
        let flavor = workflow.item.name + ': ';
        let checkNumber;
        for (checkNumber = roll.total; checkNumber > 0; checkNumber--) {
            let value = targetActor.system.spells['spell' + checkNumber]?.value;
            let max = targetActor.system.spells['spell' + checkNumber]?.max;
            if (value < max) {
                await genericUtils.update(targetActor, {['system.spells.spell' + checkNumber + '.value']: value + 1});
                flavor += genericUtils.format('CHRISPREMADES.Macros.BolsteringMagic.SlotRegained', {slotLevel: checkNumber});
                break;
            }
        }
        if (checkNumber === 0) flavor += genericUtils.translate('CHRISPREMADES.Macros.BolsteringMagic.None');
        roll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: flavor
        });
    }
}
export let bolsteringMagic = {
    name: 'Bolstering Magic',
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