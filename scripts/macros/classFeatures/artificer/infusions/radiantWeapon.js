import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let infusionId = workflow.item.flags['chris-premades']?.feature?.infusion?.radiantWeapon?.id;
    if (!infusionId) {
        let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc'));
        if (chris.getItem(actor, 'Armor Modifications')) {
            let gauntlets = chris.getItem(workflow.actor, 'Guardian Armor: Thunder Gauntlets');
            if (gauntlets) validWeapons.push(gauntlets);
        }
        if (validWeapons.length === 0) {
            ui.notifications.info('No valid weapon to infuse!');
            return;
        }
        let [selection] = await chris.selectDocument('Infuse what weapon?', validWeapons, false);
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.radiantWeapon.id', selection.id);
    } else {
        let selection = await chris.dialog(workflow.item.name, [['Yes', true], ['No', false]], 'Remove radiant weapon infusion?');
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.radiantWeapon.id', null);
    }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let originItem = chris.getItem(workflow.actor, 'Radiant Weapon');
    if (!originItem) return;
    if (workflow.item.id != originItem.flags['chris-premades']?.feature?.infusion?.radiantWeapon?.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'radiantWeapon', 150);
    if (!queueSetup) return;
    let parts = duplicate(workflow.item.system.damage.parts);
    parts[0][0] = parts[0][0] + ' + 1';
    let attackBonus = 1;
    let properties = [];
    if (workflow.item.system.properties) {
        properties = duplicate(Array.from(workflow.item.system.properties));
        properties.push('mgc');
    }
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.properties': properties, 'system.attack.bonus': attackBonus}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}
async function blind({speaker, actor, token, character, item, args, scope, workflow}) {
    let originItem = chris.getItem(workflow.actor, 'Radiant Weapon');
    if (!originItem) return;
    let saveDC = chris.getConfiguration(originItem, 'savedc');
    if (!saveDC) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'radiantWeaponBlind', 50);
    if (!queueSetup) return;
    workflow.item = workflow.item.clone({'system.save.dc': saveDC}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}
export let radiantWeapon = {
    'item': item,
    'attack': attack,
    'blind': blind
}