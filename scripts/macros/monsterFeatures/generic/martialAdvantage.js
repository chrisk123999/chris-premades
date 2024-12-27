import {combatUtils} from '../../../lib/utilities/combatUtils.js';
import {constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
import {sneakAttack} from '../../../legacyMacros.js';
async function damage({trigger, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (!combatUtils.perTurnCheck(trigger.entity, 'martialAdvantage', false, workflow.token.id)) return;
    let targetToken = workflow.targets.first();
    let nearbyTokens = tokenUtils.findNearby(targetToken, 5, 'enemy', {includeIncapacitated: false}).filter(i => i.id != workflow.token.id);
    if (!nearbyTokens.length) return;
    let auto = itemUtils.getGenericFeatureConfig(trigger.entity, 'martialAdvantage').auto;
    if (!auto) {
        let selection = await dialogUtils.confirm(trigger.entity.name, genericUtils.format('CHRISPREMADES.Macros.SneakAttack.Use', {name: trigger.entity.name}));
        if (!selection) return;
    }
    if (combatUtils.inCombat()) await combatUtils.setTurnCheck(trigger.entity, 'martialAdvantage');
    let bonusDamageFormula = itemUtils.getGenericFeatureConfig(trigger.entity, 'martialAdvantage').formula + '[' + workflow.defaultDamageType + ']';
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: workflow.defaultDamageType});
    await trigger.entity.displayCard();
    if (!itemUtils.getGenericFeatureConfig(trigger.entity, 'martialAdvantage').playAnimation) return;
    let animationType;
    if (tokenUtils.getDistance(workflow.token, targetToken) > 5) animationType = 'ranged';
    if (!animationType) animationType = workflow.defaultDamageType;
    await sneakAttack.utilFunctions.animation(targetToken, workflow.token, animationType);
}
async function combatEnd({trigger}) {
    await combatUtils.setTurnCheck(trigger.entity, 'martialAdvantage', true);
}
export let martialAdvantage = {
    name: 'Martial Advantage',
    translation: 'CHRISPREMADES.Macros.MartialAdvantage.Name',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 215
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d6'
        },
        {
            value: 'auto',
            label: 'CHRISPREMADES.SneakAttack.Auto',
            type: 'checkbox',
            default: false
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true
        }
    ]
};