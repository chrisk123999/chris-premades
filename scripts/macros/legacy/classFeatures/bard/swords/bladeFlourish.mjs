import {activityUtils, actorUtils, applications, automationUtils, combatUtils, DamageBonus, documentUtils, Logging, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
async function movementBonus({document: activity, macroClass: {identifier, source}, token, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (token && !combatUtils.isOwnTurn(token)) 
        return Logging.addMacroWarning(source, identifier, `Blade Flourish exited early. Not this character's turn in combat. (token) ${token.uuid}`);
    if (workflow.item.flags[source]?.bladeCantrip) 
        return Logging.addMacroWarning(source, identifier, `Blade Flourish exited early on a blade cantrip. (rolled item) ${workflow.item.uuid} (cantrip) ${workflow.item.flags[source].bladeCantrip}`);
    if (token?.combatant && activity.uses.value) 
        await workflowUtils.syntheticActivityRoll(activity);
    workflowUtils.setWorkflowProperty(workflow, identifier, true);
}
async function flourish({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, identifier)) return;
    if (!workflow.hitTargets.size) return;
    if (!activity.item.system.uses.value) 
        return Logging.addMacroWarning(source, identifier, `Blade Flourish exited early without item uses. (item) ${activity.item.uuid}`);
    const flourishes = activity.item.system.activities.filter(a => a.id !== activity.id && !(a.flags.cat?.hidden || a.midiProperties.automationOnly));
    const formula = Roll.replaceFormulaData(automationUtils.getConfigValue(activity.item, 'formula'), activity.getRollData());
    const bardic = actorUtils.getItemByIdentifier(activity.actor, 'bardic-inspiration', {type: 'feat'});
    const master = actorUtils.getItemByIdentifier(activity.actor, 'masters-flourish', {type: 'feat'});
    const masterDie = master ? automationUtils.getConfigValue(master, 'formula') : '';
    const prev = activity.item.flags[source]?.[identifier] ?? flourishes[0].id;
    let masterActive = bardic && !bardic.system.uses.value;
    if (masterActive && !master) 
        return Logging.addMacroWarning(source, identifier, `Blade Flourish exited early with no remaining bardic inspiration. (item) ${activity.item.uuid}`);
    let masterToggled = false;
    let originalTags;
    const inputs = [];
    if (masterDie) inputs.push(['checkbox', [{
        label: master.name, name: 'master', options: {
            tooltip: await uiUtils.enrichHTML(master.system.description.value, master.getRollData()),
            tags: [{label: `${formula} → ${masterDie}`, id: 'formula'}],
            isChecked: masterActive,
            image: master.img,
            onchange: ({bonus, input, getInputById}) => {
                if (!input.isChecked && bardic && !bardic.system.uses.value)
                    input.isChecked = masterToggled = true;
                masterActive = input.isChecked;
                bonus.roll = new bonus.rollClass(input.isChecked ? masterDie : formula, bonus.roll.data, bonus.roll.options);
                bonus.updateScaling(0, workflow);
                const bonusContext = getInputById(input.id.split(applications.DialogApp.SUBINPUT_SEPARATOR)[0]);
                originalTags ??= bonusContext.tags;
                bonusContext.tags = masterActive ? 
                    bonusContext.tags.filter(t => t.id === 'formula' || bonus.scalingHints.some(h => h.id === t.id)) :
                    originalTags;
                return true;
            }
        }
    }]]);
    inputs.push(['radio', await Promise.all(flourishes.map(async f => ({
        name: f.id,
        label: f.name,
        options: {
            image: f.img,
            isChecked: prev === f.id,
            tooltip: await uiUtils.enrichHTML(f.description.value, f.getRollData())
        }
    }))), {radioName: 'flourish'}]);
    const bonus = new DamageBonus(activity.item, {formula: masterActive ? masterDie : formula, allowCritical: automationUtils.getConfigValue(activity.item, 'critical')})
        .withInputs(inputs)
        .withDefaultCosts({activity: flourishes[0]})
        .withOnUse(async ({bonus, inputs, workflow}) => {
            const flourish = activity.item.system.activities.get(inputs.flourish);
            await documentUtils.setFlag(activity.item, source, identifier, inputs.flourish);
            const target = workflow.hitTargets.first().document;
            const combat = !!workflow.token.document.combatant;
            const options = {config: {scaling: bonus.roll.total - 1}};
            let activityData, targets = [target];
            if (documentUtils.getIdentifier(flourish) === 'flourish-slashing') {
                targets = tokenUtils.findNearby(workflow.token.document, 5, {disposition: 'enemy'}).filter(t => t.id !== target.id);
                if (!targets.length) {
                    Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.HuntersMark.NoTargets', {notify: true});
                    options.config.scaling = -1;
                }
                activityData = activityUtils.getDamageModifiedActivityData(flourish, bonus.roll.total, {types: [workflow.defaultDamageType]});
            }
            activityData ??= flourish.toObject();                 
            if (!combat) withNoCombatConsumption(activityData);
            if (inputs.master) withMasterConsumption(activityData, bardic);
            await workflowUtils.syntheticActivityDataRoll(activityData, activity.item, targets, options);
        });
    if (masterDie) {
        if (bardic?.system.uses.value) bonus.initialize(workflow);
        bonus.withCostHandler(({bonus}) => {
            const cost = DamageBonus.defaultCosts({bonus});
            if (masterActive) delete cost.itemUses?.[bardic?.uuid];
            return cost;
        }).withValidation(({bonus}) => {
            if (!masterToggled) return true;
            masterToggled = false;
            bonus.validateHints.push({label: _loc('CHRISPREMADES.Macros.Legacy.BladeFlourish.Warning', {
                resource: bardic?.name ?? _loc('DND5E.Uses'),
                item: activity.item.name,
                feature: master.name
            })});
            return true;
        });
    }
    return bonus;
}
function withNoCombatConsumption(activity) {
    activity.consumption.targets = activity.consumption.targets.filter(c => c.target || c.type !== 'itemUses');
    return activity;
}
function withMasterConsumption(activity, bardic) {
    activity.consumption.targets = activity.consumption.targets.filter(c => c.target !== bardic?.id);
    return activity;
}
export const bladeFlourish = {
    name: 'Blade Flourish',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollComplete',
            macro: movementBonus,
            priority: 200
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: flourish, 
            priority: 200
        }
    ],
    config: {
        formula: {
            default: '@scale.bard.inspiration',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        },
        critical: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CanCrit'
        }
    }
};
