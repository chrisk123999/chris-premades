import {dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
import {rage} from '../rage.js';
async function save({trigger: {config, roll, actor, entity: item}}) {
    if (config['chris-premades']?.fanaticalFocus) return;
    if (!item.system.uses.value) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'rage');
    if (!effect) return;
    let targetValue = config?.midiOptions?.targetValue;
    if (!targetValue) return;
    if (roll.total >= targetValue) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.FanaticalFocus.Use', {item: item.name, total: roll.total}));
    if (!selection) return;
    await item.use();
    genericUtils.setProperty(config, 'chris-premades.fanaticalFocus', true);
    let newSave = await actor.rollSavingThrow(config, undefined, {create: false});
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let formula = actor.system.scale?.[classIdentifier]?.[scaleIdentifier]?.formula;
    if (!formula) return newSave[0];
    let returnRoll = await rollUtils.addToRoll(newSave[0], String(formula));
    return returnRoll;
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
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'rage-damage',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: rage.scales
};