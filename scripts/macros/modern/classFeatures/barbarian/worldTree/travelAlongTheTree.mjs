import {applications, automationUtils, documentUtils, genericUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
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
    const nearRange = automationUtils.getConfigValue(activity.item, 'allyRange');
    const near = tokenUtils.findNearby(token, nearRange, {disposition: 'ally'});
    const subinputs = near.length ? [['comboboxMulti', [{
        label: 'CAT.OptionalBonus.Targets', name: 'targets', options: {maxTotal: activity.target.affects.count, options: near.map(t => ({
            value: t.id, label: t.name, image: t.texture.src
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
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, targets);
}
async function groupTeleport({macroClass: {identifier, source}, workflow}) {
    const range = automationUtils.getConfigValue(workflow.item, 'allyRange');
    const {animation, options} = automationUtils.getResolvedAnimation(workflow.item, 'animation');
    await tokenUtils.teleportToken(workflow.token.document, {animation, options, range: workflow.activity.range.value || 150, requireSight: true});
    const targets = Array.from(workflow.targets).filter(t => t.id !== workflow.token.id && (t.document.disposition * workflow.token.document.disposition >= 0)).map(t => t.document);
    if (!targets.length) return Logging.addMacroWarning(source, identifier, 'Travel along the Tree group teleport exited early with no allies targeted.');
    const message = genericUtils.notify('', {progress: true});
    for (let i = 0; i < targets.length; i++) {
        message.update({pct: (i + 1) / targets.length, message: _loc('CHRISPREMADES.Macros.Modern.TravelAlongTheTree.Group', {
            total: targets.length,
            name: targets[i].name,
            num: i + 1
        })});
        await tokenUtils.teleportToken(targets[i], {animation, options, range, centerpoint: workflow.token.center, requireSight: true});
    }
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
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: groupTeleport,
            priority: 50
        }
    ],
    config: {
        allyRange: {
            default: 10,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
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
