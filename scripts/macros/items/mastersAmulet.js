import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function mastersAmulet(token, {item, workflow, ditem}) {
    if (!workflow) return;
    let effect = chris.findEffect(token.actor, 'Shield Guardian - Bound');
    if (!effect) return;
    let targetActorId = token.actor.flags['chris-premades']?.item?.mastersAmulet?.bound;
    if (!targetActorId) return;
    let nearbyTokens = chris.findNearby(token, 60, 'ally');
    if (nearbyTokens.length === 0) return;
    let targetToken = nearbyTokens.find((tok => tok.actor.id === targetActorId));
    if (!targetToken) return;
    let queueSetup = await queue.setup(workflow.uuid, 'mastersAmulet', 400);
    if (!queueSetup) return;
    if (ditem.newHP >= ditem.oldHP) {
        queue.remove(workflow.uuid);
        return;
    }
    let keptDamage = Math.floor(ditem.appliedDamage / 2);
    let guardianDamage = Math.ceil(ditem.appliedDamage / 2);
    if (ditem.oldTempHP > 0) {
        if (keptDamage > ditem.oldTempHP) {
            ditem.newTempHP = 0;
            keptDamage -= ditem.oldTempHP;
            ditem.tempDamage = ditem.oldTempHP;
        } else {
            ditem.newTempHP = ditem.oldTempHP - keptDamage;
            ditem.tempDamage = keptDamage;
        }
    }
    let maxHP = token.actor.system.attributes.hp.max;
    ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
    ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
    ditem.appliedDamage = keptDamage;
    ditem.totalDamage = keptDamage;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Shield Guardian - Bound', false);
    if (!featureData) {
        queue.remove(workflow.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shield Guardian - Bound');
    featureData.system.damage.parts = [
        [
            guardianDamage,
            'none'
        ]
    ];
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(workflow.uuid);
}