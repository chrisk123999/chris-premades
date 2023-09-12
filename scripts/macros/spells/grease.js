import {chris} from '../../helperFunctions.js';
import {constants} from '../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'grease',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'grease',
        'templateUuid': template.uuid,
        'turn': 'end',
        'ignoreMove': true
    });
    if (workflow.failedSaves.size === 0) return;
    let turn = game.combat.round + '-' + game.combat.turn;
    let updates = {};
    for (let i of Array.from(workflow.targets)) {
        setProperty(updates, 'flags.chris-premades', 'spell.grease.' + i.id + '.turn', turn);
    }
    console.log(updates);
    await template.update(updates);
}
async function trigger(token, trigger) {
    if (chris.checkTrait(token.actor, 'ci', 'prone')) return;
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    if (chris.inCombat()) {
        let turn = game.combat.round + '-' + game.combat.turn;
        let lastTurn = template.flags['chris-premades']?.spell?.grease?.[token.id]?.turn;
        if (turn === lastTurn) return;
        await template.setFlag('chris-premades', 'spell.grease.' + token.id + '.turn', turn);
    }
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Grease - Fall', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grease - Fall');
    featureData.system.save.dc = trigger.saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}
async function enter(template, token) {
    let trigger = template.flags['chris-premades']?.template;
    if (!trigger) return;
    await grease.trigger(token.document, trigger);
}
export let grease = {
    'item': item,
    'trigger': trigger,
    'enter': enter
}