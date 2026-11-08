import {activityUtils, actorUtils, D20Bonus, dataUtils, documentUtils, genericUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
import {bardicInspiration} from '../../../../all/classFeatures/bard/bardicInspiration.mjs';
function log(msg, notify) {
    Logging.addMacroWarning('chris-premades', 'mote-of-potential', msg, {notify});
}
async function modifyInspiration({data, document: item}) {
    genericUtils.setProperty(data.effectData, 'flags.chris-premades.moteOfPotential', item.uuid);
    const macros = [{
        identifier: 'moteOfPotentialEffect',
        rules: moteOfPotential.rules,
        source: 'chris-premades'
    }];
    const remove = [{
        identifier: 'bardicInspirationEffect',
        rules: bardicInspiration.rules,
        source: 'chris-premades'
    }];
    return dataUtils.buildEffectData(data.effectData, {
        macros: [
            {type: 'called', macros},
            {type: 'check', macros},
            {type: 'skill', macros},
            {type: 'tool', macros}
        ],
        removeMacros: [
            {type: 'check', macros: remove},
            {type: 'skill', macros: remove},
            {type: 'tool', macros: remove}
        ]
    });
}
async function attackSave({data, document: effect}) {
    if (!['attack', 'save'].includes(data.bonus.type)) return;
    const item = await fromUuid(effect.flags['chris-premades']?.moteOfPotential);
    if (!item) return log(`Mote of Potential exited early without locating the origin item. (effect) ${effect.uuid}`);
    const activity = itemUtils.getActivityByIdentifier(item, 'mote-' + data.bonus.type);
    if (!activity) return log(`Mote of Potential exited early without locating its activity. (item) ${item.uuid} (identifier) mote-${data.bonus.type}`);
    if (!data.targetActor) return log(`Mote of Potential exited early on a bonus with no target actor. (bardic effect) ${data.bonus.document.uuid}`);
    const token = actorUtils.getFirstToken(data.targetActor);
    if (!token) return log(`Mote of Potential exited early on a target with no active token. (target actor) ${data.targetActor.uuid}`);
    const options = {config: {scaling: data.bonus.roll.total - 1}};
    switch(data.bonus.type) {
        case 'attack': {
            const target = data.workflow?.targets.first()?.document;
            if (!target) return log(`Mote of Potential: Attack exited early with no target token. (attacking token) ${token.uuid}`);
            const self = actorUtils.getFirstToken(data.sourceActor);
            if (!self) return log(`Mote of Potential: Attack exited early with no active token. (actor) ${data.sourceActor.uuid}`);
            const targets = tokenUtils.findNearby(target, activityUtils.getTemplateSize(activity) || 5, {disposition: 'ally', includeToken: true})
                .filter(t => tokenUtils.canSee(self, t));
            const activityData = activity.toObject();
            activityData.target.template.type = '';
            await workflowUtils.syntheticActivityDataRoll(activityData, item, targets, options);
            break;
        }
        case 'save':
            await workflowUtils.syntheticActivityRoll(activity, [token], options);
            break;
    }
}
async function moteChecks({document: effect, macroClass: {source}}) {
    const rules = documentUtils.getRules(effect);
    const phase = rules === '2024' ? 'postResult' : rules === '2014' ? 'preResult' : ['preResult', 'postResult'];
    const formula = effect.flags[source]?.bardicInspiration;
    if (!formula) return log(`Mote of Potential could not find a formula on the bardic inspiration effect! (effect) ${effect.uuid}`);
    return new D20Bonus(effect, {action: 'special', actor: effect.actor, formula: formula + 'adv', phase}).withOnUse(bardicInspiration.use);
}
export const moteOfPotential = {
    name: 'Mote of Potential',
    version: '2.1.7',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateBardicInspiration',
            macro: modifyInspiration,
            priority: 300
        }
    ]
};
const d20 = [{
    pass: 'actorOptionalBonus',
    macro: moteChecks,
    priority: 300
}];
export const moteOfPotentialEffect = {
    version: moteOfPotential.version,
    rules: moteOfPotential.rules,
    called: [
        {
            pass: 'actorUseBardicInspiration',
            macro: attackSave,
            priority: 300
        }
    ],
    check: d20,
    skill: d20,
    tool: d20
};
