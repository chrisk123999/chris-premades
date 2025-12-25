import {activityUtils, constants, genericUtils, itemUtils, rollUtils} from '../../../../utils.js';
import {hide} from '../../../2024/actions/hide.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.item || !workflow.activity || !workflow.advantage || workflow.disadvantage) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'vampireFangedBite') return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier != 'bite') return;
    let formula = itemUtils.getConfig(item, 'formula');
    if (workflow.isCritical) formula = await rollUtils.getCriticalFormula(formula, workflow.activity.getRollData());
    workflow.damageRolls[0] = await rollUtils.damageRoll(formula, workflow.activity);
    await workflow.setDamageRolls(workflow.damageRolls);
}
export let strigoiBloodline = {
    name: 'Stage 1 Boon: Strigoi Bloodline',
    version: '1.4.6',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: hide.midi.item[0].macro,
                priority: 50,
                activities: ['hide']
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 200
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d4',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'cunningAction',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ],
    hasAnimation: true
};