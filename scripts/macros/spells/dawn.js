import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'dawn',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'dawn',
        'templateUuid': template.uuid,
        'turn': 'end',
        'ignoreMove': true
    });
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Dawn - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dawn - Move');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Dawn');
    }
    let effectData = {
        'label': 'Dawn',
        'icon': workflow.item.img,
        'transfer': false,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
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
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': effectData.label,
        'description': effectData.label
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function trigger(token, trigger) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Dawn - End Turn', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dawn - End Turn');
    featureData.system.save.dc = trigger.saveDC;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}
export let dawn = {
    'item': item,
    'trigger': trigger
}