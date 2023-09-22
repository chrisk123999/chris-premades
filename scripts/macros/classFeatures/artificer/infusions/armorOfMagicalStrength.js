import {chris} from '../../../../helperFunctions.js';
export async function armorOfMagicalStrength({speaker, actor, token, character, item, args, scope, workflow}) {
    await chris.removeCondition(workflow.actor, 'Prone');
}