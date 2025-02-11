import {dialogUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function veryEarly({activity, dialog, actor, config}) {
    if (activity.item.system.uses.value) return;
    dialog.configure = false;
    let rage = itemUtils.getItemByIdentifier(actor, 'rage');
    if (!rage?.system?.uses?.value) return true;
    let selection = await dialogUtils.confirm(activity.item.name, genericUtils.format('CHRISPREMADES.Generic.ConsumeItemToUse', {item: rage.name}));
    if (!selection) return true;
    genericUtils.setProperty(config, 'consume.resources', false);
    await genericUtils.update(rage, {'system.uses.spent': rage.system.uses.spent + 1});
}
export let intimidatingPresence ={
    name: 'Intimidating Presence',
    version: '1.1.23',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50
            }
        ]
    }
};