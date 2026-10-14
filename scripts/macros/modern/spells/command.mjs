import {actorUtils, dialogUtils, documentUtils, Logging, queryUtils} from '../../../proxy.mjs';
const orders = {
    commandApproach: 'Approach',
    commandDrop: 'Drop',
    commandFlee: 'Flee',
    commandGrovel: 'Grovel',
    commandHalt: 'Halt'
};
async function turnStart({document}) {
    const order = orders[documentUtils.getIdentifier(document)];
    if (!order) return Logging.addMacroWarning('CPR', 'command-effect', 'Command effect has no recognised order identifier.', {notify: 'warn'});
    const actor = document.parent;
    if (order === 'Grovel') await actorUtils.applyConditions(actor, ['prone']);
    await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Modern.Command.' + order), {buttons: 'ok', userId: queryUtils.firstOwner(actor, true)});
}
export const commandEffect = {
    name: 'Command: Effect',
    version: '2.1.3',
    rules: '2024',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
