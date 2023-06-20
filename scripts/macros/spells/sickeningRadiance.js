import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'template', {
        'name': 'sickeningRadiance',
        'castLevel': workflow.castData.castLevel,
        'saveDC': chris.getSpellDC(workflow.item),
        'macroName': 'sickeningRadiance',
        'templateUuid': template.uuid,
        'turn': 'start',
        'ignoreMove': false
    });
}
async function trigger(token, trigger) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    if (chris.inCombat()) {
        let turn = game.combat.round + '-' + game.combat.turn;
        let lastTurn = template.flags['chris-premades']?.spell?.sickeningRadiance?.[token.id]?.turn;
        if (turn === lastTurn) return;
        await template.setFlag('chris-premades', 'spell.sickeningRadiance.' + token.id + '.turn', turn);
    }
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Sickening Radiance - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Sickening Radiance - Damage');
    featureData.system.save.dc = trigger.saveDC;
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeQuantity': false,
        'consumeUsage': false,
        'consumeSlot': false
    };
    let workflow = await MidiQOL.completeItemUse(feature, {}, options);
    if (workflow.failedSaves.size === 0) return;
    let exhaustionLevel = template.flags['chris-premades']?.spell?.sickeningRadiance?.[token.id]?.exhaustionLevel;
    if (exhaustionLevel === undefined) {
        let originalLevel = 0;
        let effect = token.actor.effects.find(eff => eff.label.includes('Exhaustion'));
        if (effect) {
            originalLevel = Number(effect.label.substring(11));
            if (isNaN(originalLevel)) originalLevel = 0;
        }
        await template.setFlag('chris-premades', 'spell.sickeningRadiance.' + token.id + '.exhaustionLevel', originalLevel);
    }
    await chris.increaseExhaustion(token.actor, originUuid);
}
async function removed(template) {
    let tokens = template.flags['chris-premades']?.spell?.sickeningRadiance;
    if (!tokens) return;
    for (let [key, value] of Object.entries(tokens)) {
        let token = game.canvas.tokens.get(key);
        if (!token) continue;
        let effect = token.actor.effects.find(eff => eff.label.includes('Exhaustion'));
        if (!effect) continue;
        await chris.removeEffect(effect);
        if (value.exhaustionLevel === 0) continue;
        await chris.addCondition(token.actor, 'Exhaustion ' + value.exhaustionLevel, false);
    }
}
export let sickeningRadiance = {
    'item': item,
    'trigger': trigger,
    'removed': removed
}