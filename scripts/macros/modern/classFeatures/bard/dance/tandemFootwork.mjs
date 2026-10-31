import {actorUtils, automationUtils, dialogUtils, documentUtils, genericUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function trigger({document: activity}) {
    const inspiration = actorUtils.getItemByIdentifier(activity.actor, 'bardic-inspiration', {type: 'feat'});
    if (!inspiration?.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity);
}
async function initBonus({document: activity, macroClass: {identifier, source}, workflow}) {
    const self = workflow.token?.document;
    if (!self) return Logging.addMacroWarning(source, identifier, `Tandem Footwork exited early without an active token. (activity) ${activity.uuid}`);
    const bonus = workflow.utilityRoll.total;
    const effect = activity.item.effects.contents[0]?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `Tandem Footwork exited early due to a missing active effect. (activity) ${activity.uuid}`);
    const combatOnly = automationUtils.getConfigValue(activity.item, 'combatantsOnly');
    genericUtils.setProperty(effect, 'system.changes.0.value', bonus);
    const updates = [], message = [];
    for (const t of workflow.targets) {
        if (t.id !== self.id && t.actor.statuses.has('deafened') && !tokenUtils.canSee(t, self)) continue;
        if (!t.combatant && combatOnly) continue;
        if (!t.combatant || t.combatant.initiative === null) updates.push({
            documentName: 'ActiveEffect',
            action: 'create',
            data: [effect],
            parent: t.actor
        });
        else {
            const init = t.combatant.initiative;
            updates.push({
                updates: [{_id: t.combatant.id, initiative: init + bonus}],
                parent: t.combatant.combat,
                documentName: 'Combatant',
                action: 'update'
            });
            message.push(`<tr>
                <th style="text-align: left;">${t.name}</th>
                <td style="text-align: right; width: 6rem;">${dnd5e.utils.formatNumber(init)} → ${dnd5e.utils.formatNumber(init + bonus)}</td>
                </tr>`
            );
        }
    }
    if (updates.length) await documentUtils.modifyBatch(updates);
    if (message.length) await ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({token: self}),
        content: `<div><b>${activity.item.name}</b></div>
                <small>${_loc('CHRISPREMADES.Macros.Modern.TandemFootWork.Change')}</small>
                <table>${message.join('')}</table>`
    });
}
export const tandemFootwork = {
    name: 'Tandem Footwork',
    version: '2.1.7',
    rules: '2024',
    combat: [
        {
            pass: 'actorPreInitiative',
            macro: trigger,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: initBonus,
            priority: 50
        }
    ],
    config: {
        combatantsOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.TandemFootWork.Combatant',
            hint: 'CHRISPREMADES.Macros.Modern.TandemFootWork.CombatantHint'
        }
    }
};
