import {chris} from '../../../helperFunctions.js';
export async function waveOfWeariness({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size === 0) return;
    this.failedSaves.forEach(async function(value, key, set) {
        await chris.increaseExhaustion(value.actor);
    });
}