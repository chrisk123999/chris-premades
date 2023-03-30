import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function focusedAim({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.isFumble) return;
    let feature = await this.actor.items.getName('Ki Points');
    if (!feature) return;
    let featureUses = feature.system.uses.value;
    if (featureUses === 0) return;
    let queueSetup = await queue.setup(this.item.uuid, 'focusedAim', 151);
    if (!queueSetup) return;
    let attackTotal = this.attackTotal;
    let target = this.targets.first();
    let targetAC = target.actor.system.attributes.ac.value;
    if (targetAC <= attackTotal) {
        queue.remove(this.item.uuid);
        return;
    }
    let featureMenu = [['Yes (1 Ki / +2 to hit)', 2]];
    if (featureUses >= 2) featureMenu.push(['Yes (2 Ki / +4 to hit)', 4]);
    if (featureUses >= 3) featureMenu.push(['Yes (3 Ki / +6 to hit)', 6]);
    featureMenu.push(['No', false]);
    let useFeature = await chris.dialog('Attack roll (' + attackTotal + ') missed.  Use Focused Aim?', featureMenu);
    if (!useFeature) {
        queue.remove(this.item.uuid);
        return;
    }
    let updatedRoll = await chris.addToRoll(this.attackRoll, useFeature);
    this.setAttackRoll(updatedRoll);
    feature.update({'system.uses.value': featureUses - (useFeature / 2)});
    let effect = chris.findEffect(this.actor, 'Focused Aim');
    if (!effect) {
        queue.remove(this.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
    queue.remove(this.item.uuid);
}
