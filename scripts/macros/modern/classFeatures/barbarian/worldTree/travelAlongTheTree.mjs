import {applications, automationUtils, documentUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function preChecks({document: activity, macroClass: {identifier, source}}) {
    if (activity.actor.flags[source]?.raging) return;
    Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Rage', {notify: 'warn'});
    return true;
}
async function rageBegin({document: activity, macroClass: {identifier, source}, token}) {
    if (activity.uses.spent) {
        await documentUtils.update(activity, {'uses.spent': 0});
        activity = activity.item.system.activities.get(activity.id);
    }
    const teleport = activity.item.system.activities.find(a => a.id !== activity.id);
    if (!teleport) return Logging.addMacroWarning(source, identifier, `Travel along the Tree is missing its teleport activity. (item) ${activity.item.uuid}`);
    const nearRange = automationUtils.getGenericConfigValue(activity, source, 'teleport', 'companionRange') || 10;
    const near = tokenUtils.findNearby(token, nearRange, {disposition: 'ally'});
    let preselected = 0;
    const subinputs = near.length ? [['comboboxMulti', [{
        label: 'CAT.OptionalBonus.Targets', name: 'targets', options: {maxTotal: activity.target.affects.count, options: near.map(t => ({
            value: t.id, label: t.name, image: t.texture.src, selected: preselected++ < activity.target.affects.count
        }))}
    }]]] : undefined;
    const choice = await applications.DialogApp.dialog(
        activity.item.name,
        _loc('CHRISPREMADES.Macros.Modern.TravelAlongTheTree.Prompt', {feature: activity.item.name}),
        [['radio', [{
            label: teleport.name, name: 'teleport', options: {isChecked: true, image: teleport.img, tags: [
                {label: teleport.labels.range, id: 'range', tooltip: 'DND5E.Range'}
            ]}
        }, {
            label: activity.name, name: 'group', options: {image: activity.img, subinputs, tags: [
                {label: activity.labels.range, id: 'range', tooltip: 'DND5E.Range'},
                {label: _loc('CHRISPREMADES.Macros.Generic.TargetCreatureTypes.ChooseTargets'), id: 'targets'}
            ]}
        }], {displayAsRows: true, radioName: 'activity'}]],
        'okCancel'
    );
    if (!choice?.buttons) return Logging.addMacroWarning(source, identifier, 'Travel along the Tree exited early due to a declined prompt.');
    if (choice.activity === 'teleport') return await specialRoll(teleport);
    const chosen = JSON.parse(choice.targets);
    await specialRoll(activity, near.filter(t => chosen.includes(t.id)));
}
async function specialRoll(activity, targets = []) {
    const data = activity.toObject();
    data.activation.type = 'special';
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'chris-premades.teleportCompanions', targets.map(t => t.id));
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, targets, {options});
}
export const travelAlongTheTree = {
    name: 'Travel along the Tree',
    version: '2.1.3',
    rules: '2024',
    called: [
        {
            pass: 'actorRageBegin',
            macro: rageBegin,
            priority: 190 // before instinctive pounce
        }
    ]
};
export const travelAlongTheTreePreChecks = {
    version: travelAlongTheTree.version,
    rules: travelAlongTheTree.rules,
    roll :[
        {
            pass: 'activityPreTargeting',
            macro: preChecks,
            priority: 50
        }
    ]
};
