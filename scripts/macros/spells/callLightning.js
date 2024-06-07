import {chris} from '../../helperFunctions.js';
export async function callLightning({speaker, actor, token, character, item, args, scope, workflow}) {
    let storming = await chris.dialog('Is it already storming?', [['Yes', true], ['No', false]]);
    let spellLevel = workflow.castData.castLevel;
    if (storming) spellLevel += 1;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Bolt', false);
    if (!featureData) return;
    featureData.system.damage.parts = [
        [
            spellLevel + 'd10[lightning]',
            'lightning'
        ]
    ];
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Storm Bolt');
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': workflow.castData
        }
    }
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Storm Bolt');
    }
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 600
        },
        'origin': workflow.item.uuid,
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
                [workflow.item.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    await chris.addDependent(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [workflow.actor.effects.getName(workflow.item.name)]);
}