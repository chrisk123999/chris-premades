import {translate} from '../../translations.js';
import {chris} from '../../helperFunctions.js';
import {constants} from '../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'insectPlague',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'insectPlague',
        'templateUuid': template.uuid,
        'turn': 'end',
        'ignoreMove': false,
        'ignoreStart': true
    });
}
async function trigger(token, trigger) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    if (chris.inCombat()) {
        let turn = game.combat.round + '-' + game.combat.turn;
        let lastTurn = template.flags['chris-premades']?.spell?.insectPlague?.[token.id]?.turn;
        if (turn === lastTurn) return;
        await template.setFlag('chris-premades', 'spell.insectPlague.' + token.id + '.turn', turn);
    }
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Insect Plague - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Insect Plague - Damage');
    featureData.system.save.dc = trigger.saveDC;
    featureData.system.damage.parts = [
        [
            (trigger.castLevel - 1) + 'd10[' + translate.damageType('piercing') + ']',
            'piercing'
        ]
    ];
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}
export let insectPlague = {
    'item': item,
    'trigger': trigger
}