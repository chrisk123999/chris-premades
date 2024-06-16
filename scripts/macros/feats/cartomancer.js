import {chris} from '../../helperFunctions.js';
export async function cartomancer({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token || !workflow.actor) return;
    let validTypes = [
        'prepared',
        'pact',
        'always'
    ]
    let spells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.activation.type === 'action' && validTypes.includes(i.system.preparation?.mode));
    if (!spells.length) return;
    let [selection] = await chris.selectDocument(workflow.item.name, spells);
    if (!selection) return;
    let spellData = duplicate(selection.toObject());
    delete spellData._id;
    setProperty(spellData, 'system.activation.type', 'bonus');
    setProperty(spellData, 'system.uses', {'max': 1, 'per': 'lr', 'recovery': '', 'value': 1});
    setProperty(spellData, 'system.preparation.mode', 'atwill');
    setProperty(spellData, 'name', spellData.name + ' (' + workflow.item.name + ')');
    async function effectMacro() {
        await warpgate.revert(token.document, 'Cartomancer');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'flags': {
            'dae': {
                'specialDuration': [
                    'longRest'
                ]
            },
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': spellData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [spellData.name]: spellData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Cartomancer',
        'description': 'Cartomancer'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}