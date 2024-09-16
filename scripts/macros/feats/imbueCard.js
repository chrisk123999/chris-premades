import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let validTypes = ['prepared', 'pact', 'always'];
    let validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.activation.type === 'action' && validTypes.includes(i.system.preparation?.mode));
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.AberrantDragonmark.NoValid', 'info');
        return;
    }
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ImbueCard.Select', validSpells);
    if (!selection) return;
    let spellData = genericUtils.duplicate(selection.toObject());
    delete spellData._id;
    genericUtils.mergeObject(spellData, {
        name: spellData.name + ' (' + workflow.item.name + ')',
        system: {
            'activation.type': 'bonus',
            uses: {max: 1, per: 'lr', recovery: '', value: 1},
            'preparation.mode': 'atwill'
        },
        flags: {
            'chris-premades': {
                macros: {
                    midi: {
                        item: ['imbueCardUse']
                    }
                }
            }
        }
    });
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 28800
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'imbueCard', vae: [{type: 'use', name: spellData.name, identifier: 'imbueCardSpell'}]});
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [spellData], {favorite: true, parentEntity: effect, identifier: 'imbueCardSpell'});
}
export let imbueCard = {
    name: 'Cartomancer: Hidden Ace - Imbue Card',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Cartomancer: Hidden Ace - Imbue Card': [
                'Cartomancer: Hidden Ace - Flourish Imbued Card'
            ]
        }
    }
};