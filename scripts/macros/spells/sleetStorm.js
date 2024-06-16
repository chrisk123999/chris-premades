import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.templateId) return;
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.update({
        'flags': {
            'chris-premades': {
                'template': {
                    'name': 'sleetStorm',
                    'castLevel': workflow.castData.castLevel,
                    'saveDC': chris.getSpellDC(workflow.item),
                    'macroName': 'sleetStorm',
                    'templateUuid': template.uuid,
                    'turn': 'start',
                    'ignoreMove': false
                },
                'spell': {
                    'fogCloud': true
                }
            },
            'limits': {
                'sight': {
                    'basicSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'devilsSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'lightPerception': {
                        'enabled': true,
                        'range': 0
                    },
                    'seeAll': {
                        'enabled': true,
                        'range': 0
                    }
                }
            },
            'walledtemplates': {
                'wallRestriction': 'move',
                'wallsBlock': 'recurse',
            }
        }
    });
}
async function trigger(token, trigger, reason) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    if (chris.inCombat()) {
        let turn = game.combat.round + '-' + game.combat.turn;
        let lastTurn = template.flags['chris-premades']?.spell?.sleetStorm?.[token.id]?.turn;
        if (turn === lastTurn) return;
        await template.setFlag('chris-premades', 'spell.sleetStorm.' + token.id + '.turn', turn);
    }
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Sleet Storm - Prone', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Sleet Storm - Prone');
    featureData.system.save.dc = trigger.saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
    if (reason === 'turnStart' && MidiQOL.getConcentrationEffect(token.actor)) await MidiQOL.doConcentrationCheck(token.actor, trigger.saveDC);
}
export let sleetStorm = {
    'item': item,
    'trigger': trigger
};