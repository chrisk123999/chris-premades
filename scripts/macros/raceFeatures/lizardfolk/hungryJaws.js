import {chris} from '../../../helperFunctions.js';
export async function hungryJaws({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0) return;
    let profBonus = this.actor.system.attributes.prof;
    await chris.applyDamage(this.token, profBonus, 'temphp');
}