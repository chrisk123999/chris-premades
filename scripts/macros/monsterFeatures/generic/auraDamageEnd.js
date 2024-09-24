import {actorUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function turnEnd({trigger: {entity: item, token, target}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'auraDamageEnd');
    if (!config.affectAllies) {
        if (token.document.disposition === target.document.disposition) return;
    }
    if (tokenUtils.getDistance(token, target) > config.distance) return;
    if (config.immuneCreatures.includes(actorUtils.typeOrRace(target.actor))) return;
    await workflowUtils.syntheticItemRoll(item, [target]);
}
export let auraDamageEnd = {
    name: 'Aura Damage: End of Turn',
    version: '0.12.77',
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'distance',
            label: 'CHRISPREMADES.Generic.Distance',
            type: 'number',
            default: 30
        },
        {
            value: 'immuneCreatures',
            label: 'CHRISPREMADES.Config.ImmuneCreatures',
            type: 'creatureTypes',
            default: ['undead', 'fiend']
        },
        {
            value: 'affectAllies',
            label: 'CHRISPREMADES.Config.AffectAllies',
            type: 'checkbox',
            default: true
        }
    ]
};