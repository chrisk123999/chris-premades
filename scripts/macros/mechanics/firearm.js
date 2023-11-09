import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
function setup(enabled) {
    if (enabled) {
        CONFIG.DND5E.weaponIds['firearmCR'] = 'chris-premades.CPR Item Features.OAl2Qv4lKE0qJoJP';
        CONFIG.DND5E.featureTypes.class.subtypes.trickShot = 'Trick Shot';
        Hooks.on('midi-qol.preItemRoll', status);
        Hooks.on('midi-qol.preCheckHits', misfire);
        Hooks.on('midi-qol.RollComplete', grit);
        Hooks.on('midi-qol.RollComplete', critical);
    } else {
        delete CONFIG.DND5E.weaponIds['firearmCR'];
        delete CONFIG.DND5E.featureTypes.class.subtypes.trickShot;
        Hooks.off('midi-qol.preItemRoll', status);
        Hooks.off('midi-qol.preCheckHits', misfire);
        Hooks.off('midi-qol.RollComplete', grit);
        Hooks.off('midi-qol.RollComplete', critical);
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
    let baseItem = workflow.item.system.baseItem;
    if (baseItem != 'firearmCR') return;
    let proficient = workflow.item.system.proficient;
    if (!proficient && isNewerVersion(game.version, '11.293')) proficient = workflow.item.actor.system.traits.weaponProf.value.has(baseItem);
    let misfireScore = chris.getConfiguration(workflow.item, 'misfire') ?? 1;
    if (!proficient) misfireScore += 1;
    if (workflow.attackRoll.terms[0].total > misfireScore) return;
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
    let tinker = workflow.actor.items.find(i => i.system.baseItem === 'tinker');
    if (!tinker) {
        ui.notifications.info('You have no Tinker\'s Tools to make the repair with!');
        return;
    }
    let roll = await workflow.actor.rollToolCheck('tinker');
    let misfireDC = 8 + chris.getConfiguration(weapon, 'misfire') ?? 1;
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
async function grit(workflow) {
    if (!workflow.item) return;
    if (workflow.hitTargets.size != 1) return;
    let baseItem = workflow.item.system.baseItem;
    if (baseItem != 'firearmCR') return;
    let regain = 0;
    if (workflow.d20AttackRoll === 20 || (chris.getItem(workflow.actor, 'Vicious Intent') && workflow.d20AttackRoll === 19)) {
        regain++;
    }
    if (workflow.damageItem) {
        let oldHP = workflow.damageItem.oldHP;
        let newHP = workflow.damageItem.newHP;
        if (oldHP != 0 && newHP === 0) regain++;
    }
    if (!regain) return;
    let feature = chris.getItem(workflow.actor, 'Adept Marksman');
    if (!feature) return;
    let max = feature.system.uses.max;
    let value = feature.system.uses.value ?? 0;
    if (value === max) return;
    let clamped = Math.clamped(value + regain, 0, max);
    await feature.update({'system.uses.value': clamped});
    ui.notifications.info('Grit regained! (+' + regain + ')');
}
async function critical(workflow) {
    let baseItem = workflow.item.system.baseItem;
    if (baseItem != 'firearmCR') return;
    if (!workflow.isCritical || !workflow.damageRoll || workflow.targets.size != 1) return;
    let feature = chris.getItem(workflow.actor, 'Hemorrhaging Critical');
    if (!feature) return;
    let damage = Math.floor(workflow.damageItem.appliedDamage / 2);
    let effectData = {
        'label': feature.name,
        'icon': feature.img,
        'origin': feature.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'flags.midi-qol.OverTime',
                'mode': 0,
                'value': 'turn=end,damageRoll=' + damage + ',damageType=' + workflow.defaultDamageType + ',label=Hemorrhaging Critical',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnEnd'
                ]
            }
        }
    }
    await feature.displayCard();
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
export let firearm = {
    'setup': setup,
    'reload': reload,
    'status': status,
    'misfire': misfire,
    'repair': repair,
    'grit': grit,
    'critical': critical
}