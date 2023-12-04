import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let infusionId = workflow.item.flags['chris-premades']?.feature?.infusion?.returningWeapon?.id;
    if (!infusionId) {
        let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties?.mgc && i.system.properties?.thr);
        if (validWeapons.length === 0) {
            ui.notifications.info('No valid weapon to infuse!');
            return;
        }
        let [selection] = await chris.selectDocument('Infuse what weapon?', validWeapons, false);
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.returningWeapon.id', selection.id);
    } else {
        let selection = await chris.dialog(workflow.item.name, [['Yes', true], ['No', false]], 'Remove returning weapon infusion?');
        if (!selection) return;
        await workflow.item.setFlag('chris-premades', 'feature.infusion.returningWeapon.id', null);
    }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let originItem = chris.getItem(workflow.actor, 'Returning Weapon');
    if (!originItem) return;
    if (workflow.item.id != originItem.flags['chris-premades']?.feature?.infusion?.returningWeapon?.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'returningWeapon', 150);
    if (!queueSetup) return;
    let parts = duplicate(workflow.item.system.damage.parts);
    parts[0][0] = parts[0][0] + ' + 1';
    let properties = duplicate(workflow.item.system.properties);
    let attackBonus = duplicate(workflow.item.system.attackBonus);
    attackBonus = 1;
    properties.mgc = true;
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.properties': properties, 'system.attackBonus': attackBonus}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}
export let returningWeapon = {
    'item': item,
    'attack': attack
}