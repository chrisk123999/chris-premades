import {chris} from '../../../helperFunctions.js';
export async function terrorFrenzy({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let effect = chris.findEffect(this.targets.first().actor, 'Frightened');
    if (!effect) return;
    this.advantage = true;
    this.attackAdvAttribution['Terror Frenzy'] = true;
}