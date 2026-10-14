import {actorUtils, dialogUtils, documentUtils, genericUtils, Logging} from '../../../../../proxy.mjs';
async function preTargeting({document, config, dialog}) {
    if (document.system.uses.value) return;
    dialog.configure = false;
    const rage = actorUtils.getItemByIdentifier(document.actor, 'rage');
    if (!rage?.system?.uses?.value) {
        Logging.addMacroWarning('CPR', 'intimidating-presence', 'No uses or Rage uses remaining.');
        return true;
    }
    const selection = await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Generic.ConsumeItemToUse', {item: rage.name}));
    if (!selection) return true;
    genericUtils.setProperty(config, 'consume.resources', false);
    await documentUtils.update(rage, {'system.uses.spent': rage.system.uses.spent + 1});
}
export const intimidatingPresence = {
    name: 'Intimidating Presence',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: preTargeting,
            priority: 50
        }
    ]
};
