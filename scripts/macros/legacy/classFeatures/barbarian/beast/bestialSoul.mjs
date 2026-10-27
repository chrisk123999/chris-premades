import {dialogUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function jump({data, document: activity, macroClass: {identifier, source}, token}) {
    if (!activity.uses.value) return;
    if (!activity.actor.flags[source]?.[activity.identifier]) return; // this bestial soul is not active
    if (!await dialogUtils.confirmUseItem(activity)) return;
    const workflow = await workflowUtils.syntheticActivityRoll(activity);
    const roll = workflow.tokenSaves[token.uuid]?.total;
    if (!roll) return Logging.addMacroWarning(source, identifier, `Bestial Soul: Jumping exited early due to a failed roll parse. (activity) ${activity.uuid}`);
    data.formula += ` + ${roll}`;
    if (!token?.combatant) await workflow.refundConsumption();
}
export const bestialSoulJump = {
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorJump',
            macro: jump,
            priority: 200
        }
    ]
};
