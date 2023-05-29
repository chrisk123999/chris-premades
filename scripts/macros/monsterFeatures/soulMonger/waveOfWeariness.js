import {chris} from '../../../helperFunctions.js';
export async function waveOfWeariness({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size === 0) return;
    workflow.failedSaves.forEach(async function(value, key, set) {
        await chris.increaseExhaustion(value.actor);
    });
}