import {activityUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
import {keeperOfSouls} from '../../../../all/classFeatures/cleric/grave/keeperOfSouls.mjs';
async function extraTarget({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflow.item.type !== 'spell' || workflowUtils.isSustainedRoll(workflow)) return;
    const id = documentUtils.getIdentifier(workflow.item);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(divineReaper.config));
    if (!config.spellList.length || !config.spellList.includes(id)) {
        if (workflow.targets.count !== 1 || workflow.activity.target.template.size > 0) return;
        if (config.spellLevel && workflowUtils.getCastLevel(workflow) > config.spellLevel) return;
        if (config.spellSchool.length && !config.spellSchool.includes(workflow.item.system.school)) return;
    }
    if (!activityUtils.checkCosts(activity))
        return Logging.addMacroWarning(source, identifier, `Enhanced Necromancy exited early with no channel divinity uses. (activity) ${activity.uuid}`);
    const targets = tokenUtils.findNearby(workflow.tokenDocument, workflow.rangeDetails.range).filter(t =>
        !tokenUtils.isEnemy(t, workflow.targets.documents[0]) && !workflow.targets.documents.some(tgt => tgt.id === t.id)
    );
    if (!targets.length)
        return Logging.addMacroWarning(source, identifier, `Enhanced Necromancy exited early with no targets in range. (activity) ${activity.uuid} (range) ${workflow.rangeDetails.range}`);
    const document = activityUtils.hasDefaultName(activity) ? activity.item.name : activity.name;
    const choice = await dialogUtils.selectTargetDialog(
        activity.item.name,
        _loc('CAT.Dialog.UseOn', {document, target: workflow.item.name}),
        targets,
        {skipDeadAndUnconscious: false}
    );
    if (!choice?.result) return;
    await workflowUtils.syntheticActivityRoll(activity, [choice.result]);
    await workflowUtils.updateTargets(workflow, [...workflow.targets.documents, choice.result]);
}
export const divineReaper = {
    name: 'Divine Reaper',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorTargeting',
            macro: extraTarget,
            priority: 50
        }
    ],
    config: {
        ...keeperOfSouls.config,
        spellLevel: {
            default: '5',
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.SpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellLevelHint',
            get options() { return constants.spellSlotOptions; }
        },
        spellSchool: {
            default: ['nec'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchoolHint',
            get options() { return constants.spellSchoolOptions; }
        },
        spellList: {
            default: ['gentle-repose', 'ray-of-enfeeblement', 'spare-the-dying', 'revivify', 'blight', 'death-ward', 'raise-dead'],
            type: 'selectIdentifiers',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.SpellList'
        }
    }
};
