import {rollUtils} from '../../../utils.js';
async function damage({trigger, workflow}) {
    let flagData = workflow.item.flags['chris-premades']?.setDamageRoll;
    let options = workflow.damageRolls[0].options;
    let rolls = [];
    if (flagData?.formula) 
        rolls.push(await rollUtils.damageRoll(String(flagData.formula), workflow.activity, options));
    else if (flagData?.typesAmountsMap)
        for (const [type, amount] of Object.entries(flagData.typesAmountsMap)) {
            if (amount == 0) continue;
            rolls.push(await rollUtils.damageRoll(String(amount), workflow.activity, {...options, type}));
        }
    if (rolls.length) await workflow.setDamageRolls(rolls);
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