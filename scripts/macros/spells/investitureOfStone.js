import {chris} from '../../helperFunctions.js';
export async function investitureOfStone({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    async function effectMacro() {
        await warpgate.revert(token.document, 'Investiture of Stone');
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Investiture of Stone - Earthquake', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investiture of Stone - Earthquake');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'baseLevel': 6,
                'castLevel': workflow.castData.castLevel,
                'school': 'trs'
            }
        }
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 600
        },
        'changes': [
            {
                'key': 'system.traits.dr.custom',
                'mode': 0,
                'value': 'Non-Magical Physical',
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Investiture of Stone',
        'description': 'Investiture of Stone'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    await chris.addDependents(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [workflow.actor.effects.getName(workflow.item.name)]);
}