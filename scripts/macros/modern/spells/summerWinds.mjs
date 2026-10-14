import {actorUtils, automationUtils, constants, itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
async function early({document, workflow}) {
    if (workflow.activity.identifier !== 'summer-winds' || !workflow.targets.size) return;
    const disposition = workflow.token?.document.disposition;
    const allies = Array.from(workflow.targets).filter(token => token.document.disposition === disposition);
    const creatureTypes = automationUtils.getConfigValue(document, 'affectedCreatureTypes');
    const undead = Array.from(workflow.targets).filter(token => token.document.disposition !== disposition && token.actor && creatureTypes.includes(actorUtils.typeOrRace(token.actor)));
    workflowUtils.setWorkflowProperty(workflow, 'summerWinds', undead.map(token => token.document.uuid));
    if (allies.length !== workflow.targets.size) await workflowUtils.updateTargets(workflow, allies);
}
async function late({document, workflow, castData}) {
    if (workflow.activity.identifier !== 'summer-winds') return;
    const undead = (workflowUtils.getWorkflowProperty(workflow, 'summerWinds') ?? []).map(uuid => fromUuidSync(uuid, {strict: false})).filter(Boolean);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (workflow.token && animation?.macros?.play) {
        animation.macros.play(workflow.token.document, workflow.template, {
            ...options,
            allies: Array.from(workflow.targets, token => token.document),
            undead
        });
    }
    if (!undead.length) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'summer-winds-undead');
    if (!activity) return Logging.addMacroWarning('CPR', 'summer-winds', 'CHRISPREMADES.Macros.Modern.SummerWinds.MissingActivity', {notify: 'warn'});
    await workflowUtils.syntheticActivityRoll(activity, undead, {spellSlot: false, atLevel: castData.castLevel});
}
export const summerWinds = {
    name: 'Summer Winds',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        affectedCreatureTypes: {
            default: ['undead'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'summerWinds'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
