import {documentUtils, rollUtils} from '../../../../proxy.mjs';
async function saveBonus({actor, config, roll}) {
    if (!config.isConcentration) return;
    if (!actor.concentration.items.some(i => documentUtils.getIdentifier(i) === 'hunters-mark')) return;
    const target = config.target;
    const bonus = target - roll.total;
    if (bonus > 0) return await rollUtils.addToRoll(roll, bonus);
}
export const relentlessHunter = {
    name: 'Relentless Hunter',
    version: '2.1.4',
    rules: '2024',
    save: [
        {
            pass: 'actorBonus',
            macro: saveBonus,
            priority: 50
        }
    ]
};
