import {rollUtils} from '../../utils.js';
async function damage({trigger, workflow}) {
    let flagData = workflow.item.flags['chris-premades']?.setDamageRoll;
    if (!flagData.formula) return;
    let roll = await rollUtils.damageRoll(String(flagData.formula), workflow.actor, workflow.damageRolls[0].options);
    await workflow.setDamageRolls([roll]);
}
export let setDamageRoll = {
    name: 'Set Damage Roll',
    version: '0.12.78',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 900
            }
        ]
    }
};