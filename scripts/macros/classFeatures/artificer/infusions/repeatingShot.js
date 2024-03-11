import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let infusionId = workflow.item.flags['chris-premades']?.feature?.infusion?.repeatingShot?.id;
    if (!infusionId) {
        let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.properties.has('amm'));
        if (validWeapons.length === 0) {
            ui.notifications.info('No valid weapon to infuse!');
            return;
        }
        let [selection] = await chris.selectDocument('Infuse what weapon?', validWeapons, false);
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.repeatingShot.id', selection.id);
    } else {
        let selection = await chris.dialog(workflow.item.name, constants.yesNo, 'Remove repeating shot infusion?');
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.repeatingShot.id', null);
    }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let originItem = chris.getItem(workflow.actor, 'Repeating Shot');
    if (!originItem) return;
    if (workflow.item.id != originItem.flags['chris-premades']?.feature?.infusion?.repeatingShot?.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'repeatingShot', 150);
    if (!queueSetup) return;
    let parts = duplicate(workflow.item.system.damage.parts);
    parts[0][0] = parts[0][0] + ' + 1';
    let attackBonus = duplicate(workflow.item.system.attackBonus);
    attackBonus = level;
    let properties = [];
    if (workflow.item.system.properties) {
        properties = duplicate(Array.from(workflow.item.system.properties));
        properties.push('mgc');
    }
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.properties': properties, 'system.attackBonus': attackBonus}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}
export let repeatingShot = {
    'item': item,
    'attack': attack
}