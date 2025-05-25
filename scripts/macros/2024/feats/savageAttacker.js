import {combatUtils, dialogUtils, genericUtils, rollUtils} from '../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || workflow.activity.actionType !== 'mwak') return;
    if (!combatUtils.perTurnCheck(item, 'savageAttacker')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'savageAttacker');
    await Promise.all(workflow.activity.damage.parts.map(async part => {
        if (!part.custom.enabled) {
            part.custom.enabled = true;
            let expression = part.number + 'd' + part.denomination;
            part.custom.formula = 'max(' + expression + ', ' + expression + ')' + (part.bonus ? ' + ' + part.bonus : '');
        }
        else {
            part.custom.formula = part.custom.formula.replace(/\d+d\d+/gmi, 'max($&, $&)');
        }
    }));
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'savageAttacker', true);
}
export let savageAttacker = {
    name: 'Savage Attacker',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};