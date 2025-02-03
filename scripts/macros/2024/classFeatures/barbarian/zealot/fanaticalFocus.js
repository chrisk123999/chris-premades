import {dialogUtils, effectUtils, genericUtils} from '../../../../../utils.js';
async function save({trigger: {config, roll, actor, entity: item}}) {
    console.log(config);
    if (!item.system.uses.value) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'rage');
    if (!effect) return;
    let targetValue = config?.midiOptions?.targetValue;
    console.log(targetValue);
    if (!targetValue) return;
    console.log(roll);
    if (roll.total >= targetValue) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.FanaticalFocus.Use', {item: item.name, total: roll.total}));
    if (!selection) return;
    //Something here!
}
export let fanaticalFocus = {
    name: 'Fanatical Focus',
    version: '1.1.28',
    rules: 'modern',
    save: [
        {
            pass: 'bonus',
            macro: save,
            priority: 100
        }
    ]
};