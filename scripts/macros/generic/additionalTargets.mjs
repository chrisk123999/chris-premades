import {automationUtils, constants, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function extraTarget({document: item, workflow}) {
    if (!workflow.targets.size) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'additionalTargets', Object.keys(additionalTargets.genericConfig));
    if (config.damageType.length) {
        const damage = workflow.activity.damage ?? workflow.activity.otherActivity?.damage;
        if (!damage) return;
        if (!damage.parts.some(p => config.damageType.some(d => p.types.has(d)))) return;
    }
    if (config.healingType.length) {
        const heal = workflow.activity.healing;
        if (!heal) return;
        if (!config.healingType.some(d => heal.types.has(d))) return;
    }
    if (config.identifiers.length) {
        if (!config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
    }
    if (config.itemType.length) {
        if (!config.itemType.includes(workflow.item.type)) return;
    }
    const nearby = new Set();
    const options = {disposition: config.disposition, includeIncapacitated: true};
    if (config.rangeFrom === 'target') {
        for (const token of workflow.targets) {
            tokenUtils.findNearby(token.document, config.range, options).forEach(t => nearby.add(t));
        }
    } else {
        tokenUtils.findNearby(workflow.token.document, config.range, options).forEach(t => nearby.add(t));
    }
    if (!nearby.size) return;
    const selection = (await dialogUtils.selectTargetDialog(
        'CHRISPREMADES.Config.AdditionalTargets',
        _loc('CAT.Dialog.UseOn', {document: item.name, target: workflow.item.name}),
        nearby,
        {
            maxAmount: config.targets >= 1 ? config.targets : null,
            skipDeadAndUnconscious: false,
            type: config.targets === 1 ? 'one' : 'multiple'
        }
    ))?.result;
    if (!selection) return;
    const targets = Array.from(workflow.targets);
    if (Array.isArray(selection)) targets.push(...selection);
    else targets.push(selection);
    await workflowUtils.updateTargets(workflow, targets);
    if (config.rollItem) await workflowUtils.completeItemUse(item);
    else {
        const activity = item.system.activities.get(config.rollActivity);
        if (!activity) return;
        await workflowUtils.completeActivityUse(activity);
    }
}
export const additionalTargets = {
    rules: 'all',
    version: '2.0.2',
    category: 'targeting',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'actorTargeting',
            macro: extraTarget,
            priority: 200
        }
    ],
    genericConfig: {
        damageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.DamageTypeHint',
            get options() { return constants.damageTypeOptions(); }
        },
        healingType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.HealingType',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.HealingTypeHint',
            get options() { return constants.healingTypeOptions(); }
        },
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.IdentifierHint'
        },
        itemType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.ItemTypeHint',
            get options() { return constants.usableItemTypes(); }
        },
        disposition: {
            default: 'ally',
            type: 'select',
            category: 'behavior',
            label:'CHRISPREMADES.Config.Disposition',
            get options() { return [
                {value: 'all', label: _loc('CHRISPREMADES.Config.All')},
                {value: 'ally', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.MatchTarget')},
                {value: 'enemy', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.HostileTarget')},
                {value: 'neutral', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.NeutralTarget')}
            ]; }
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        },
        rangeFrom: {
            default: 'target',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.RangeFrom',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.RangeFromHint',
            get options() { return [
                {value: 'attacker', label: _loc('CHRISPREMADES.Config.Attacker')},
                {value: 'target', label: _loc('CHRISPREMADES.Config.Target')}
            ]; }
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.RollActivity'
        },
        rollItem: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.AdditionalTargets.RollItem'
        },
        targets: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AdditionalTargets',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.TargetHint'
        }
    }
};
