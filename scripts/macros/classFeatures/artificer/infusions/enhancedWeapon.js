import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let infusionId = workflow.item.flags['chris-premades']?.feature?.infusion?.enhancedWeapon?.id;
    if (!infusionId) {
        let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc'));
        if (chris.getItem(actor, 'Armor Modifications')) {
            let gauntlets = chris.getItem(workflow.actor, 'Guardian Armor: Thunder Gauntlets');
            if (gauntlets) validWeapons.push(gauntlets);
            let launcher = chris.getItem(workflow.actor, 'Infiltrator Armor: Lightning Launcher');
            if (launcher) validWeapons.push(launcher);
        }
        if (validWeapons.length === 0) {
            ui.notifications.info('No valid weapon to infuse!');
            return;
        }
        let [selection] = await chris.selectDocument('Infuse what weapon?', validWeapons, false);
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.enhancedWeapon.id', selection.id);
    } else {
        let selection = await chris.dialog(workflow.item.name, [['Yes', true], ['No', false]], 'Remove enhanced weapon infusion?');
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.enhancedWeapon.id', null);
    }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let originItem = chris.getItem(workflow.actor, 'Enhanced Weapon, +2') ?? chris.getItem(workflow.actor, 'Enhanced Weapon, +1');
    if (!originItem) return;
    if (workflow.item.id != originItem.flags['chris-premades']?.feature?.infusion?.enhancedWeapon?.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'enhancedWeapon', 150);
    if (!queueSetup) return;
    let parts = duplicate(workflow.item.system.damage.parts);
    let level = chris.getConfiguration(originItem, 'level') ?? 1;
    parts[0][0] = parts[0][0] + ' + ' + level;
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
export let enhancedWeapon = {
    'item': item,
    'attack': attack
};