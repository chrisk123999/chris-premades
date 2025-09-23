import {dialogUtils, genericUtils, rollUtils} from '../../../../utils.js';
async function save({trigger: {roll, entity: item}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    if (!item.actor.system.attributes.hd.value) return;
    let selection = await dialogUtils.selectHitDie(item.actor, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name, rollTotal: roll.total}), undefined, {max: 1});
    if (!selection) return;
    return await rollUtils.addToRoll(roll, '1' + selection[0].document.system.hd.denomination);
}
export let bloodPrice = {
    name: 'Blood Price',
    version: '1.3.69',
    rules: 'legacy',
    save: [
        {
            pass: 'bonus',
            macro: save,
            priority: 50
        }
    ],
};