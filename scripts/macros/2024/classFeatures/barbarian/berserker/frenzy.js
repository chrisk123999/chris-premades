import {combatUtils, constants, effectUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
import {rage} from '../rage.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!workflow.token || !workflow.hitTargets.size || !combatUtils.isOwnTurn(workflow.token) || !constants.attacks.includes(workflowUtils.getActionType(workflow)) || workflow.activity.ability != 'str' || !effectUtils.getEffectByIdentifier(workflow.actor, 'recklessAttackEffect') || !effectUtils.getEffectByIdentifier(workflow.actor, 'rage')) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let dieNumber = workflow.actor.system.scale?.[classIdentifier]?.[scaleIdentifier]?.formula;
    if (!dieNumber || isNaN(dieNumber)) return;
    let diceSize = itemUtils.getConfig(item, 'dieSize');
    await workflowUtils.bonusDamage(workflow, dieNumber + diceSize, {dammageType: workflow.defaultDamageType});
    await workflowUtils.completeItemUse(item, undefined, {configureDialog: false});
}
export let frenzy = {
    name: 'Frenzy',
    version: '1.1.23',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'rage-damage',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'dieSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            options: constants.diceSizeOptions,
            default: 'd6',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: rage.scales
};