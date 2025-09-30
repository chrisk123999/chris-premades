import {rollUtils} from '../../../../utils.js';
async function saveBonus({trigger: {saveId, roll, actor, config}}) {
    if (config.isConcentration && actor.concentration.items.some(i => chrisPremades.utils.genericUtils.getIdentifier(i) === 'huntersMark')) {
        let oldTotal = roll.total;
        let target = config.target;
        let bonus = target - oldTotal;
        if (bonus > 0) {
            let newRoll = await rollUtils.addToRoll(roll, bonus);
            return newRoll;
        }
    }
}
export let relentlessHunter = {
    name: 'Relentless Hunter',
    version: '1.3.78',
    save: [
        {
            pass: 'bonus',
            macro: saveBonus,
            priority: 50
        }
    ]
};