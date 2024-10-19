import {constants} from '../../lib/constants.js';
import {dialogUtils, genericUtils, itemUtils, rollUtils} from '../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.item) return;
    if (workflow.item.system.actionType != 'rwak' || !workflow.item.system.damage.parts.length) return;
    let selection = await dialogUtils.confirm(trigger.entity.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: trigger.entity.name}));
    if (!selection) return;
    await trigger.entity.use();
    let parts = workflow.item.toObject().system.damage.parts;
    let bonusFormula = itemUtils.getConfig(trigger.entity, 'bonus');
    let bonus = workflow.item.system.attack.bonus === '' ? bonusFormula : workflow.item.system.attack.bonus + ' + ' + bonusFormula;
    let formula = itemUtils.getConfig(trigger.entity, 'formula');
    parts[0][0] += ' + ' + formula + '[' + workflow.defaultDamageType + ']'; 
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.attack.bonus': bonus}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let sharpshooter = {
    name: 'Sharpshooter',
    version: '1.0.8',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 150
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '10',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'bonus',
            label: 'CHRISPREMADES.Config.AttackBonus',
            type: 'text',
            default: '-5',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};