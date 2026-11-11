import {automationUtils, constants, dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function use({document: activity, workflow}) {
    const target = workflow.targets.documents[0];
    if (!workflow.token || !target?.actor) return;
    const item = activity.item;
    const userId = queryUtils.gmID();
    const willing = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.Influence.HowWilling', [
        ['CHRISPREMADES.Macros.Modern.Influence.Willing', 'willing', {image: 'icons/skills/social/thumbs-up.webp'}],
        ['CHRISPREMADES.Macros.Modern.Influence.Unwilling', 'unwilling', {image: 'icons/skills/social/wave-halt-stop.webp'}],
        ['CHRISPREMADES.Macros.Modern.Influence.Hesitant', 'hesitant', {image: 'icons/skills/social/trading-injustice-scale-gray.webp'}]
    ], {userId});
    if (willing !== 'hesitant') return;
    const attitude = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.Influence.Attitude', [
        ['CHRISPREMADES.Macros.Modern.Influence.Indifferent', 'indifferent', {image: 'icons/skills/social/trading-justice-scale-gold.webp'}],
        ['CHRISPREMADES.Macros.Modern.Influence.Friendly', 'friendly', {image: 'icons/skills/social/diplomacy-handshake.webp'}],
        ['CHRISPREMADES.Macros.Modern.Influence.Hostile', 'hostile', {image: 'icons/skills/social/intimidation-impressing.webp'}]
    ], {userId});
    if (!attitude) return;
    const skills = automationUtils.getConfigValue(item, 'skills').filter(key => CONFIG.DND5E.skills[key]);
    if (!skills.length) return;
    const skill = skills.length === 1 ? skills[0] : await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.Influence.Skill', skills.map(key => [CONFIG.DND5E.skills[key].label, key, {image: CONFIG.DND5E.skills[key].icon}]), {userId});
    if (!skill) return;
    const checkActivity = itemUtils.getActivityByIdentifier(item, 'check');
    if (!checkActivity) return;
    const activityData = checkActivity.toObject();
    activityData.check.associated = [skill];
    activityData.check.dc = {calculation: '', formula: String(Math.max(automationUtils.getConfigValue(item, 'minimumDC') ?? 15, target.actor.system.abilities.int.value))};
    const options = {};
    if (attitude === 'friendly') workflowUtils.grantRollModifier(options, 'adv', workflow.token.document.id, 'influence', _loc('CHRISPREMADES.Macros.Modern.Influence.Friendly'));
    if (attitude === 'hostile') workflowUtils.grantRollModifier(options, 'dis', workflow.token.document.id, 'influence', _loc('CHRISPREMADES.Macros.Modern.Influence.Hostile'));
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [workflow.token.document], {options});
}
export const influence = {
    name: 'Influence',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        minimumDC: {
            default: 15,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.Influence.MinimumDC',
            hint: 'CHRISPREMADES.Macros.Modern.Influence.MinimumDCHint'
        },
        skills: {
            default: ['dec', 'itm', 'prf', 'per', 'ani'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Skills',
            hint: 'CHRISPREMADES.Macros.Modern.Influence.SkillsHint',
            get options() { return constants.skillOptions; }
        }
    }
};
