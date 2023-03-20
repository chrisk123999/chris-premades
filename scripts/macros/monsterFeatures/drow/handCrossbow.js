import {chris} from '../../../helperFunctions.js';
export async function handCrossbow({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size != 1 || this.hitTargets.size != 1) return;
    let targetActor = this.targets.first().actor;
    if (this.saveResults[0].total + 5 > this.item.system.save.dc) return;
    let isImmune = chris.checkTrait(targetActor, 'ci', 'poisoned');
    if (isImmune) return;
    await chris.addCondition(targetActor, 'Unconscious', true, this.item.uuid);
}