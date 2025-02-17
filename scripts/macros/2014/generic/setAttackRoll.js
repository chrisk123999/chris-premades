import {rollUtils} from '../../../utils.js';
async function attack({trigger, workflow}) {
    let flagData = workflow.item.flags['chris-premades']?.setAttackRoll;
    let roll;
    if (flagData.formula) {
        roll = await rollUtils.rollDice(String(flagData.formula));
    } else if (flagData.rollJSON) {
        roll = await Roll.fromData(flagData.rollJSON);
    }
    if (roll) await workflow.setAttackRoll(roll);
}
export let setAttackRoll = {
    name: 'Set Attack Roll',
    version: '0.12.52',
    midi: {
        item: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 0
            }
        ]
    }
};