import {dialogUtils, effectUtils, genericUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function save({trigger: {roll, entity: item, token}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    if (!item.actor.system.attributes.hd.value) return;
    let selection = await dialogUtils.selectHitDie(item.actor, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name, rollTotal: roll.total}), undefined, {max: 1});
    if (!selection?.amount) return;
    await genericUtils.update(selection[0].document, {'system.hd.spent': selection[0].document.system.hd.spent + 1});
    let newRoll = await rollUtils.addToRoll(roll, '1' + selection[0].document.system.hd.denomination);
    let infernalMajestyEffect = effectUtils.getEffectByIdentifier(item.actor, 'infernalMajestyEffect');
    if (infernalMajestyEffect) {
        if (token) {
            let validTokens = tokenUtils.findNearby(token, 10, 'enemy', {includeIncapacitated: true}).filter(target => tokenUtils.canSee(token, target));
            if (!validTokens.length) return;
            let selection;
            if (validTokens.length === 1) {
                selection = validTokens[0];
            } else {
                let selected = await dialogUtils.selectTargetDialog(infernalMajestyEffect.name, 'CHRISPREMADES.Macros.InfernalMajesty.SelectTarget', validTokens, {skipDeadAndUnconscious: false});
                if (!selected) return;
                selection = selected[0];
            }
            await workflowUtils.applyDamage([selection], newRoll.terms[newRoll.terms.length - 1].total, 'none');
        }
    }
    return newRoll;
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