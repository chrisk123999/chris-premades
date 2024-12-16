import {actorUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
// TODO - cleanup on version update auraDamageEnd -> auraDamage
async function turnStart({trigger: {entity: item, token, target}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'auraDamageEnd');
    if (config.trigger != 'start') return;
    await damage({trigger: {entity: item, token, target}});
}
async function turnEnd({trigger: {entity: item, token, target}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'auraDamageEnd');
    // TODO - cleanup on version update removing the undefined backwards compatibility cornercase
    if (config.trigger && config.trigger != 'end') return;
    await damage({trigger: {entity: item, token, target}});
}
async function damage({trigger: {entity: item, token, target}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'auraDamageEnd');
    if (!config.affectAllies) if (token.document.disposition === target.document.disposition) return;
    if (tokenUtils.getDistance(token, target) > config.distance) return;
    if (config.immuneCreatures.includes(actorUtils.typeOrRace(target.actor))) return;
    await workflowUtils.syntheticItemRoll(item, [target]);
}
export let auraDamageEnd = {
    translation: 'CHRISPREMADES.Macros.AuraDamage.Name',
    version: '1.0.50',
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50
        },
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
        },
        {
            value: 'trigger',
            label: 'CHRISPREMADES.Config.TurnTrigger',
            type: 'select',
            options: [
                {
                    label: 'CHRISPREMADES.Generic.TurnStart',
                    value: 'start'
                },
                {
                    label: 'CHRISPREMADES.Generic.TurnEnd',
                    value: 'end'
                }
            ],
            default: 'end'
        },
    ]
};