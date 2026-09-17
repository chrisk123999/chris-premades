import {automationUtils, constants, documentUtils, rollUtils, tokenUtils} from '../../proxy.mjs';
async function doGrapple({document: activity, token, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'grapple', Object.keys(grapple.genericConfig));
    const data = {
        rules: documentUtils.getRules(activity.item),
        checkSize: config.checkSize,
        contest: !config.auto
    };
    if (config.useActivityInfo) data.activity = activity;
    if (config.dc) data.flatDC = (await rollUtils.rollDice(config.dc, {document: activity}))?.total;
    for (const {document: target} of workflow.targets) {
        if (target.actor) await tokenUtils.grapple(token, target, data);
    }
    if (config.replaceActivity) {
        workflow.aborted = true;
        return true;
    }
}
async function addConditions({document: activity, data}) {
    const conditions = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'grapple', 'conditions');
    if (conditions.length) data.targetEffectData.flags.cat.conditions.push(...conditions);
}
export const grapple = {
    rules: 'all',
    version: '2.0.3',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: doGrapple,
            priority: 50
        }
    ],
    grapple: [
        {
            pass: 'actorPreGrapple',
            macro: addConditions,
            priority: 50
        }
    ],
    genericConfig: {
        auto: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Config.AutoApply',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.AutoHint'
        },
        checkSize: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.Size'
        },
        dc: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.FlatDC',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.FlatDCHint'
        },
        conditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            hint: 'CHRISPREMADES.Macros.Generic.Grapple.ConditionsHint',
            get options() { return constants.statusOptions(); }
        },
        useActivityInfo: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.ActivityInfo',
            hint:'CHRISPREMADES.Macros.Generic.Grapple.ActivityInfoHint'
        },
        replaceActivity: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Grapple.ReplaceActivity',
            hint:'CHRISPREMADES.Macros.Generic.Grapple.ReplaceActivityHint'
        }
    }
};
