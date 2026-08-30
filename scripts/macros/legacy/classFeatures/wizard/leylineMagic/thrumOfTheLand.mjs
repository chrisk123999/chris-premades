import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
function getAttunedTerrain(actor) {
    return actorUtils.getEffectByIdentifier(actor, 'natural-attunement')?.flags['chris-premades']?.naturalAttunement;
}
async function onCast({document: item, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflowUtils.getWorkflowProperty(workflow, 'thrumOfTheLand')) return;
    const isLeyline = !!workflow.item.flags['chris-premades']?.naturalAttunement;
    const levels = (itemUtils.getAdvancementSourceItem(item) ?? workflow.actor.classes.wizard)?.system?.levels ?? 0;
    const isHighLevel = levels >= 14 && (workflowUtils.getCastLevel(workflow) ?? 0) >= 6;
    if (!isLeyline && !isHighLevel) return;
    if (!isLeyline && !item.system.uses.value) return;
    const activity = workflow.activity;
    const attackBonus = automationUtils.getConfigValue(item, 'attackBonus') ?? 2;
    const dcBonus = automationUtils.getConfigValue(item, 'dcBonus') ?? 1;
    const buttons = [];
    if (activity?.attack && attackBonus) buttons.push([_loc('CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.Attack', {bonus: attackBonus}), 'attack']);
    if (activity?.hasSave && dcBonus) buttons.push([_loc('CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.DC', {bonus: dcBonus}), 'dc']);
    if (workflow.item.system.properties?.has('concentration')) buttons.push([_loc('CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.Concentration'), 'concentration']);
    if (!buttons.length) return;
    buttons.push([_loc('DND5E.None'), false]);
    const terrain = getAttunedTerrain(workflow.actor);
    const content = _loc('CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.Select', {
        itemName: item.name,
        spellName: workflow.item.name,
        terrain: terrain ? terrain.capitalize() : _loc('CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.Unattuned')
    });
    const selection = await dialogUtils.buttonDialog(item.name, content, buttons);
    if (!selection) return;
    workflowUtils.setWorkflowProperty(workflow, 'thrumOfTheLand', selection);
    if (!isLeyline) await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    if (selection === 'attack') {
        const activityData = activity.toObject();
        activityData.attack.bonus = activityData.attack.bonus ? activityData.attack.bonus + ' + ' + attackBonus : String(attackBonus);
        workflowUtils.setActivity(workflow, activityData);
    } else if (selection === 'dc') {
        const activityData = activity.toObject();
        activityData.save.dc.calculation = '';
        activityData.save.dc.formula = String(activity.save.dc.value + dcBonus);
        workflowUtils.setActivity(workflow, activityData);
    }
}
async function concentration({workflow}) {
    if (workflowUtils.getWorkflowProperty(workflow, 'thrumOfTheLand') !== 'concentration') return;
    const effect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!effect) return;
    const changes = effect.toObject().changes;
    changes.push({key: 'flags.midi-qol.advantage.concentration', mode: 0, value: '1', priority: 20});
    const updates = {changes};
    if (effect.duration.value) updates['duration.value'] = effect.duration.value * 2;
    await documentUtils.update(effect, updates);
}
export const thrumOfTheLand = {
    name: 'Thrum of the Land',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: onCast,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: concentration,
            priority: 50
        }
    ],
    config: {
        attackBonus: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.AttackBonus',
            category: 'homebrew'
        },
        dcBonus: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.ThrumOfTheLand.DCBonus',
            category: 'homebrew'
        }
    }
};
