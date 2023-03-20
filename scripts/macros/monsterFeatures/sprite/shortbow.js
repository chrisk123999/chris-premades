import {chris} from '../../../helperFunctions.js'
export async function shortbow({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.failedSaves.size != 1) return;
    let targetActor = this.targets.first().actor;
    if (!chris.findEffect(targetActor, 'Poisoned')) return;
    let saveResult = this.saveResults[0].total;
    if (saveResult <= 5) await chris.addCondition(targetActor, 'Unconscious', false, this.item.uuid);
}