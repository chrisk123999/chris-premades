import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
function setup(enabled) {
    if (enabled) {
        CONFIG.DND5E.weaponIds['firearmCR'] = 'chris-premades.CPR Item Features.OAl2Qv4lKE0qJoJP';
    } else {
        delete CONFIG.DND5E.weaponIds['firearmCR'];
    }
}
async function reload({speaker, actor, token, character, item, args, scope, workflow}) {
    let ammunition = workflow.actor.items.filter(i => i.system.consumableType === 'ammo' && i.system.quantity);
    if (!ammunition.length) {
        ui.notifications.info('You have no ammunition!');
        return;
    }
    let weapons = workflow.actor.items.filter(i => i.system.baseItem === 'firearmCR' && i.system.uses.value != i.system.uses.max);
    if (!weapons.length) {
        ui.notifications.info('You have no firearms to reload!');
        return;
    }
    let weapon;
    if (weapons.length === 1) {
        weapon = weapons[0];
    } else {
        [weapon] = await chris.selectDocument(workflow.item.name, weapons);
    }
    if (!weapon) return;
    let ammo;
    if (ammunition.length === 1) {
        ammo = ammunition[0];
    } else {
        [ammo] = await chris.selectDocument(workflow.item.name, ammunition);
    }
    if (!ammo) return;
    let usesLeft = ammo.system.quantity;
    let clip = weapon.system.uses.value;
    let clipSize = weapon.system.uses.max;
    let ammoRestored = Math.min(usesLeft, clipSize - clip);
    await weapon.update({'system.uses.value': clip + ammoRestored});
    await ammo.update({'system.quantity': usesLeft - ammoRestored});
}
async function status(workflow) {
    if (!workflow.item) return;
    let status = chris.getConfiguration(workflow.item, 'status');
    if (!status) return;
    ui.notifications.info('This firearm must be repaired first!');
    return false;
}
async function misfire(workflow) {
    if (!workflow.item) return;
    let baseItem = workflow.item?.system?.baseItem;
    if (baseItem != 'firearmCR') return;
    let proficient = workflow.item.system.proficient;
    if (!proficient && isNewerVersion(game.version, '11.293')) proficient = item.actor.system.traits.weaponProf.value.has(baseItem);
    let misfireScore = chris.getConfiguration(workflow.item, 'misfire') ?? 1;
    if (!proficient) misfireScore += 1;
    if (workflow.d20AttackRoll > misfireScore) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'misfire', 50);
    if (!queueSetup) return;
    workflow.isFumble = true;
    await ChatMessage.create({
        speaker: {'alias': name},
        content: workflow.item.name + ' has misfired!'
    });
    let updates = {
        'flags.chris-premades.configuration.status': 1,
        'name': workflow.item.name += ' (Damaged)'
    }
    await workflow.item.update(updates);
    queue.remove(workflow.item.uuid);
}
async function repair({speaker, actor, token, character, item, args, scope, workflow}) {
    let repairFirearms = workflow.actor.items.filter(i => chris.getConfiguration(i, 'status') === 1);
    if (!repairFirearms.length) {
        ui.notifications.info('You have no firearms to repair!');
        return;
    }
    let weapon;
    if (repairFirearms.length === 1) weapon = repairFirearms[0];
    if (!weapon) weapon = await chris.selectDocument(workflow.item.name, repairFirearms);
    if (!weapon) return;
    let roll = await actor.rollToolCheck('tinker');
    let misfireDC = 8 + chris.getConfiguration(workflow.item, 'misfire') ?? 1;
    let updates;
    if (roll.total >= misfireDC) {
        updates = {
            'flags.chris-premades.configuration.status': 0,
            'name': weapon.name.replace(' (Damaged)', '')
        }
    } else {
        updates = {
            'flags.chris-premades.configuration.status': 2,
            'name': weapon.name.replace(' (Damaged)', ' (Broken)')
        }
    }
    await weapon.update(updates);
}
export let firearm = {
    'setup': setup,
    'reload': reload,
    'status': status,
    'misfire': misfire,
    'repair': repair
}