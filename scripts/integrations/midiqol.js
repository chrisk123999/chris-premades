/* eslint-disable no-case-declarations */
import {constants} from '../constants.js';
import {chris} from '../helperFunctions.js';
export async function overtimeCreator(effect) {
    let type = await chris.dialog('Overtime Creator', [['Saving Throw', 'save'], ['Ability Check', 'check'], ['Skill Check', 'skill'], ['No Save or Check', 'none']], 'What type of overtime is this effect?');
    if (!type) return;
    let inputs = [
        {
            'type': 'select',
            'label': 'Trigger:',
            'options': [
                {
                    'html': 'End of Turn',
                    'value': 'end'
                },
                {
                    'html': 'Start of Turn',
                    'value': 'start'
                }
            ]
        },
        {},
        {
            'type': 'select',
            'label': 'Difficulity Class:',
            'options': [
                {
                    'html': 'Spell',
                    'value': 'spell'
                },
                {
                    'html': 'Item',
                    'value': 'item'
                },
                {
                    'html': 'Flat',
                    'value': 'flat'
                }
            ].concat(Object.values(CONFIG.DND5E.abilities).map(i => (
                {
                    'html': i.label,
                    'value': i.abbreviation
                }
            )))
        },
        {
            'type': 'checkbox',
            'label': 'Remove on Success:',
            'options': true
        },
        {
            'type': 'checkbox',
            'label': 'Is Magical:',
            'options': false
        },
        {
            'type': 'select',
            'label': 'Uses Action:',
            'options': [
                {
                    'html': 'No',
                    'value': false,
                    'selected': true
                },
                {
                    'html': 'Yes (Roll)',
                    'value': 'roll',
                    'selected': false
                },
                {
                    'html': 'Yes (Dialog)',
                    'value': 'dialog',
                    'selected': false
                }
            ]
        },
        {
            'type': 'text',
            'label': 'Damage Roll*:',
            'options': ''
        },
        {
            'type': 'select',
            'label': 'Damage Type*:',
            'options': Object.entries(CONFIG.DND5E.damageTypes).map(i => ({
                'html': i[1].label,
                'value': i[0],
                'selected': i[0] === 'midi-none'
            }))
        },
        {
            'type': 'select',
            'label': 'Damage Application*:',
            'options': [
                {
                    'html': 'Half Damage',
                    'value': 'halfdamage',
                    'selected': type != 'none'
                },
                {
                    'html': 'Full Damage',
                    'value': 'fulldamage',
                    'selected': type === 'none' 
                },
                {
                    'html': 'No Damage',
                    'value': 'nodamage'
                }
            ]
        },
        {
            'type': 'checkbox',
            'label': 'Apply Damage First*:',
            'options': false
        },
        {
            'type': 'select',
            'label': 'Roll Mode:',
            'options': [
                {
                    'html': 'Public Roll',
                    'value': 'publicroll'
                },
                {
                    'html': 'GM Roll',
                    'value': 'gmroll'
                },
                {
                    'html': 'Blind Roll',
                    'value': 'blindroll'
                },
                {
                    'html': 'Self Roll',
                    'value': 'selfroll'
                }
            ]
        },
        {
            'type': 'checkbox',
            'label': 'Allow Incapacitated:',
            'options': true
        },
        {
            'type': 'select',
            'label': 'Fast Forward Damage:',
            'options': [
                {
                    'html': 'Default',
                    'value': -1
                },
                {
                    'html': 'Yes',
                    'value': 1
                },
                {
                    'html': 'No',
                    'value': 0
                }
            ]
        },
        {
            'type': 'text',
            'label': 'Macro to Run*:',
            'options': ''
        },
        {
            'type': 'text',
            'label': 'Name:',
            'options': effect.name
        },
        {
            'type': 'checkbox',
            'label': 'Append Trigger to Name:',
            'options': true
        },
        {
            'type': 'text',
            'label': 'Chat Flavor*:',
            'options': ''
        }
    ];
    switch (type) {
        case 'save':
        case 'check':
            inputs[1] = {
                'type': 'select',
                'label': 'Save Ability:',
                'options': Object.values(CONFIG.DND5E.abilities).map(i => (
                    {
                        'html': i.label,
                        'value': i.abbreviation
                    }
                ))
            };
            break;
        case 'skill':
            inputs[1] = {
                'type': 'select',
                'label': 'Skill:',
                'options': Object.entries(CONFIG.DND5E.skills).map(i => (
                    {
                        'html': i[1].label,
                        'value': i[0]
                    }
                ))
            };
            break;
        case 'none':
            inputs.splice(1, 5);
            break;
    }
    let selection = await chris.menu('Overtime Creator', constants.okCancel, inputs, true, 'Areas marked with an asterisk are optional.');
    if (!selection.buttons) return;
    let output = selection.inputs;
    let value;
    if (type != 'none') {
        let dc = 10;
        switch(output[2]) {
            case 'spell':
                dc = '@attributes.spelldc';
                break;
            case 'item':
                dc = '@item.save.dc';
                break;
            case 'flat':
                let selection2 = await chris.menu('Overtime Creator', constants.okCancel, [{'type': 'number', 'label': 'Flat DC:', 'options': chris.getSpellDC(effect.parent)}], true);
                if (!selection2.buttons) return;
                dc = selection2.inputs[0];
                break;
            default:
                dc = '@abilities.' + output[2] + '.dc';
        }
        value = 'turn=' + output[0] + ', rollType=' + type + ', saveAbility=' + output[1] + ', saveDC=' + dc + ', saveRemove=' + output[3] + ', saveMagic=' + output[4] + ', actionSave=' + output[5];
    } else {
        output = [output[0]].concat([null, null, null, null, null]).concat(output.toSpliced(0, 1));
        value = 'turn=' + output[0];
    }
    let damageRoll = output[6];
    if (damageRoll != '') value+= ', damageRoll=' + damageRoll + ', damageType=' + output[7] + ', saveDamage=' + output[8] + ', damageBeforeSave=' + output[9];
    value += ', rollMode=' + output[10] + ', allowIncapacitated=' + output[11];
    switch (output[12]) {
        case 0:
            value += ', fastForwardDamage=true';
            break;
        case 1:
            value += ', fastForwardDamage=false';
    }
    if (output[13] != '') value += ', macro=' + output[13];
    value += ', name=' + output[14];
    if (output[15]) {
        if (output[0] === 'start') value += ' (Start of Turn)';
        else value += ' (End of Turn)';
    }
    if (output[16] != '') value += ', chatFlavor=' + output[16];
    let effectData = duplicate(effect.toObject());
    effectData.changes.push({
        'key': 'flags.midi-qol.OverTime',
        'value': value,
        'mode': 0,
        'priority': 20
    });
    let updates = {
        'effects': [effectData]
    };
    await effect.parent.update(updates);
    effect.sheet.render(true);
}