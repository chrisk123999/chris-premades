import {chris} from '../../../helperFunctions.js';
export async function deathGaze({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size != 1) return;
    let targetToken = this.targets.first();
    if (chris.checkTrait(targetToken.actor, 'ci', 'frightened')) return;
    if ((this.saveResults[0].total + 5) > chris.getSpellDC(this.item)) return;
    let targetHP = targetToken.actor.system.attributes.hp.value;
    await chris.applyDamage([targetToken], targetHP, 'none');
}