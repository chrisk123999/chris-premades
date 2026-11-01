import {actorUtils, applications, automationUtils, constants, dialogUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.item.system.level) return;
    if (workflowUtils.isSustainedRoll(workflow)) return;
    if (!['spell', 'pact'].includes(workflow.item.system.method)) return;
    const schools = automationUtils.getConfigValue(activity.item, 'spellSchool');
    if (schools.length && !schools.includes(workflow.item.system.school)) return;
    if (!activity.item.system.uses.value)
        if (!actorUtils.getItemByIdentifier(activity.actor, 'bardic-inspiration', {type: 'feat'})?.system.uses.value)
            return Logging.addMacroWarning(source, identifier, `Beguiling Magic exited early with no item uses. (item) ${activity.item.uuid}`);
    if (!workflow.token?.document) 
        return Logging.addMacroWarning(source, identifier, `Beguiling Magic exited early without an active token. (item) ${activity.item.uuid}`);
    const near = tokenUtils.findNearby(workflow.token.document, activity.range.value || 60, {disposition: 'enemy'})
        .filter(t => tokenUtils.canSee(workflow.token.document, t));
    if (!near.length) 
        return Logging.addMacroWarning(source, identifier, `Beguiling Magic exited early with no nearby targets. (item) ${activity.item.uuid}`);
    const activities = activity.item.system.activities.filter(a => a.type === 'save').map(a => ({label: a.name, image: a.item.img, value: a.id}));
    const hide = game.settings.get('cat', 'hideNames');
    const counter = {value: 1};
    const choices = await applications.DialogApp.dialog(
        activity.item.name,
        'CHRISPREMADES.Generic.SelectTarget',
        [
            ['combobox', [{label: 'DND5E.Effect', name: 'activity', options: {options: activities, value: activities[0].value}}]],
            ['radio', near.map((t, i) => ({
                label: dialogUtils.getTokenName(t, {hide, counter}),
                options: {isChecked: i === 0, image: t.texture.src},
                name: t.id
            })), {displayAsRows: true, radioName: 'target'}]
        ],
        'okCancel'
    );
    if (!choices?.buttons) return Logging.addMacroWarning(source, identifier, `Beguiling Magic exited early due to a declined prompt. (item) ${activity.item.uuid}`);
    const chosen = activity.item.system.activities.get(choices.activity);
    const target = near.find(t => t.id === choices.target);
    await workflowUtils.syntheticActivityRoll(chosen, [target]);
}
export const beguilingMagic = {
    name: 'Beguiling Magic',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: use,
            priority: 200
        }
    ],
    config: {
        spellSchool: {
            default: ['enc', 'ill'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchoolHint',
            get options() { return constants.spellSchoolOptions; }
        }
    }
};
