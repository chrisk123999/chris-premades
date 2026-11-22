import {automationUtils, constants, documentUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function doGrapple({document: activity, token, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'grapple', Object.keys(grapple.genericConfig));
    const data = {
        rules: documentUtils.getRules(activity.item),
        checkSize: config.checkSize,
        contest: !config.auto,
        conditions: config.conditions
    };
    if (config.useActivityInfo) data.activity = activity;
    if (config.dc) data.flatDC = (await rollUtils.rollDice(config.dc, {document: activity}))?.total;
    if (config.bonus) data.bonus = (await rollUtils.rollDice(config.bonus, {document: activity, message: true, flavor: activity.item.name}))?.total;
    for (const target of workflow.targets.documents) {
        if (target.actor) await tokenUtils.grapple(token, target, data);
    }
    if (config.replaceActivity) {
        workflowUtils.setWorkflowProperty(workflow, 'keepConsumption', true);
        workflow.aborted = true;
        return true;
    }
}
/**
 * Attempts to grapple each target before the activity rolls. The escape DC comes from Flat DC, then the activity's
 * save DC, then the grappler's Athletics check. With Replace Activity on, the activity's own roll is canceled and its
 * consumption is kept.
 */
export const grapple = {
    rules: 'all',
    version: '2.1.9',
    category: 'conditions',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: doGrapple,
            priority: 50
        }
    ],
    genericConfig: {
        auto: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Config.AutoApply',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.Auto.Hint'
        },
        checkSize: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.Size',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.CheckSize.Hint'
        },
        dc: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Grapple.FlatDC.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.FlatDC.Hint'
        },
        bonus: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Grapple.Bonus.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.Bonus.Hint'
        },
        conditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.Conditions.Hint',
            get options() { return constants.statusOptions; }
        },
        useActivityInfo: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.ActivityInfo.Label',
            hint:'CHRISPREMADES.Macros.Generic.Grapple.ActivityInfo.Hint'
        },
        replaceActivity: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.ReplaceActivity.Label',
            hint:'CHRISPREMADES.Macros.Generic.Grapple.ReplaceActivity.Hint'
        }
    }
};
