import {actorUtils, itemUtils} from '../../../../utils.js';
import {arcaneWardHelper} from './arcaneWard.js';

async function sceneDamageApplication({trigger: {token, targetToken}, ditem}) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let item = itemUtils.getItemByIdentifier(token.actor, 'arcaneWard');
    if (!item) return;
    await arcaneWardHelper(item, ditem, token, targetToken);
}
export let projectedWard = {
    name: 'Projected Ward',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: sceneDamageApplication,
                priority: 50
            }
        ]
    }
};