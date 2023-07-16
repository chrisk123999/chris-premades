import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function focusedAim({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.isFumble) return;
    let feature = await workflow.actor.items.getName('Ki Points');
    if (!feature) return;
    let featureUses = feature.system.uses.value;
    if (featureUses === 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'focusedAim', 151);
    if (!queueSetup) return;
    let attackTotal = workflow.attackTotal;
    let target = workflow.targets.first();
    let targetAC = target.actor.system.attributes.ac.value;
    if (targetAC <= attackTotal) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let featureMenu = [['Yes (1 Ki / +2 to hit)', 2]];
    if (featureUses >= 2) featureMenu.push(['Yes (2 Ki / +4 to hit)', 4]);
    if (featureUses >= 3) featureMenu.push(['Yes (3 Ki / +6 to hit)', 6]);
    featureMenu.push(['No', false]);
    let useFeature = await chris.dialog('Attack roll (' + attackTotal + ') missed.  Use Focused Aim?', featureMenu);
    if (!useFeature) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, useFeature);
    workflow.setAttackRoll(updatedRoll);
    feature.update({'system.uses.value': featureUses - (useFeature / 2)});
    let effect = chris.findEffect(workflow.actor, 'Focused Aim');
    if (!effect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
    queue.remove(workflow.item.uuid);
}
