import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.update({
        'flags': {
            'chris-premades': {
                'template': {
                    'name': 'hungerOfHadar',
                    'castLevel': workflow.castData.castLevel,
                    'saveDC': chris.getSpellDC(workflow.item),
                    'macroName': 'hungerOfHadar',
                    'templateUuid': template.uuid,
                    'turn': 'both'
                }
            },
            'limits': {
                'light': {
                    'enabled': true,
                    'range': 0
                }
            },
            'walledtemplates': {
                'wallRestriction': 'move',
                'wallsBlock': 'walled'
            }
        }
    });
    let tokens = chris.templateTokens(template).map(i => game.canvas.scene.tokens.get(i)).filter(j => !chris.findEffect(j.actor, 'Hunger of Hadar'));
    let effectData = {
        'label': 'Hunger of Hadar',
        'icon': workflow.item.img,
        'origin': template.uuid,
        'duration': {
            'seconds': 600
        },
        'changes': [
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': 'Blinded',
                'priority': 20
            }
        ]
    };
    for (let t of tokens) await chris.createEffect(t.actor, effectData);
}
async function trigger(token, trigger, reason) {
    let template = await fromUuid(trigger.templateUuid);
    if (!template) return;
    let originUuid = template.flags.dnd5e?.origin;
    if (!originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    if (reason === 'move') {
        let templates = chris.tokenTemplates(token).map(i => canvas.scene.templates.get(i)).filter(i => i.flags['chris-premades']?.template?.name === 'hungerOfHadar');
        if (!templates.length) {
            let effect = chris.findEffect(token.actor, 'Hunger of Hadar');
            if (!effect) return;
            await chris.removeEffect(effect);
        } else {
            let effect = chris.findEffect(token.actor, 'Hunger of Hadar');
            if (effect) {
                if (effect.origin === template.uuid) return;
                await chris.removeEffect(effect);
            }
            let effectData = {
                'label': 'Hunger of Hadar',
                'icon': originItem.img,
                'origin': template.uuid,
                'duration': {
                    'seconds': 600
                },
                'changes': [
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Blinded',
                        'priority': 20
                    }
                ]
            };
            await chris.createEffect(token.actor, effectData);
        }
    } else {
        let queueSetup = await queue.setup(trigger.templateUuid, 'hunterOfHadar-' + reason, 50);
        if (!queueSetup) return;
        let itemName = reason === 'turnStart' ? 'Hunger of Hadar - Cold' : 'Hunger of Hadar - Tentacles';
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', itemName, false);
        if (!featureData) {
            queue.remove(trigger.templateUuid);
            return;
        }
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', itemName);
        if (itemName === 'Hunger of Hadar - Tentacles') featureData.system.save.dc = trigger.saveDC;
        delete featureData._id;
        let feature = new CONFIG.Item.documentClass(featureData, {'parent': originItem.actor});
        let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
        await MidiQOL.completeItemUse(feature, config, options);
        queue.remove(trigger.templateUuid);
    }
}
async function removed(template) {
    let tokens = game.canvas.scene.tokens.filter(i => i.actor.effects.find(j => j.origin === template.uuid));
    for (let token of tokens) {
        let templates = chris.tokenTemplates(token).map(i => canvas.scene.templates.get(i)).filter(j => j.flags.dnd5e?.origin != template.flags.dnd5e.origin);
        if (templates.length) return;
        let effect = chris.findEffect(token.actor, 'Hunger of Hadar');
        await chris.removeEffect(effect);
    }
}
export let hungerOfHadar = {
    'item': item,
    'trigger': trigger,
    'removed': removed
}