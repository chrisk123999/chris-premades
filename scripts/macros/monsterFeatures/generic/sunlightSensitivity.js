import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';

async function skillContext({trigger: {skillId, actor}}) {
    if (skillId !== 'prc') return;
    let token = actorUtils.getFirstToken(actor);
    if (token && tokenUtils.getLightLevel(token) !== 'bright') return;
    return {label: 'CHRISPREMADES.Macros.SunlightSensitivity.Skill', type: 'disadvantage'};
}
async function early({trigger: {entity: item}, workflow}) {
    if (workflow.disadvantage) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    if (tokenUtils.getLightLevel(workflow.token) !== 'bright') return;
    let config = itemUtils.getGenericFeatureConfig(item, 'sunlightSensitivity');
    if (!config.auto) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SunlightSensitivity.Attack', {tokenName: workflow.token.name}));
        if (!selection) return;
    }
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + item.name);
}
export let sunlightSensitivity = {
    name: 'Sunlight Sensitivity',
    translation: 'CHRISPREMADES.Macros.SunlightSensitivity.Name',
    version: '0.12.78',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    skill: [
        {
            pass: 'context',
            macro: skillContext,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'auto',
            label: 'CHRISPREMADES.Macros.SunlightSensitivity.Auto',
            type: 'checkbox',
            default: false
        }
    ]
};