import {automationUtils, constants, dialogUtils, documentUtils, Logging, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function extraTarget({document: item, macroClass: {identifier, source}, workflow}) {
    if (!workflow.targets.count || workflow.activity.target.template.size > 0) return;
    const bladeCantrip = workflow.item.flags['chris-premades']?.bladeCantrip;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'additionalTargets', Object.keys(additionalTargets.genericConfig));
    if (config.originalTargets >= 1 && workflow.targets.count > config.originalTargets) return;
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
        if (bladeCantrip) {
            if (!['spell', 'weapon'].some(t => config.itemType.includes(t))) return;
        } else if (!config.itemType.includes(workflow.item.type)) return;
    }
    if (config.sourceClasses && !config.sourceClasses.split(',').map(value => value.trim()).includes(workflow.item.system.classIdentifier)) return;
    if (workflow.item.type === 'spell' || bladeCantrip) {
        if (config.spellLevel.length) {
            const castLevel = bladeCantrip ? 0 : workflowUtils.getCastLevel(workflow);
            if (!config.spellLevel.includes(String(castLevel))) return;
        }
        if (config.spellSchool.length) {
            const school = bladeCantrip?.school ?? workflow.item.system.school;
            if (!config.spellSchool.includes(school)) return;
        }
    }
    if (config.firstCastOnly && workflowUtils.isSustainedRoll(workflow)) return;
    const nearby = new Set();
    const options = {disposition: config.disposition, includeIncapacitated: true};
    if (config.rangeFrom === 'target') {
        for (const token of workflow.targets.tokens) {
            tokenUtils.findNearby(token.document, config.range, options).forEach(t => nearby.add(t));
        }
    } else {
        tokenUtils.findNearby(workflow.token.document, config.range, options).forEach(t => nearby.add(t));
    }
    if (!nearby.size) return;
    const selection = (await dialogUtils.selectTargetDialog(
        'CHRISPREMADES.Macros.Generic.AdditionalTargets.AdditionalTargets',
        _loc('CAT.Dialog.UseOn', {document: item.name, target: workflow.item.name}),
        nearby,
        {
            maxAmount: config.targets >= 1 ? config.targets : null,
            skipDeadAndUnconscious: false,
            type: config.targets === 1 ? 'one' : 'multiple'
        }
    ))?.result;
    if (!selection) return;
    const targets = workflow.targets.documents;
    if (Array.isArray(selection)) targets.push(...selection);
    else targets.push(selection);
    await workflowUtils.updateTargets(workflow, targets);
    if (config.rollActivity) {
        const activity = item.system.activities.get(config.rollActivity);
        if (!activity) return Logging.addMacroWarning(source, identifier, 'Configured roll activity not found.', {notify: 'warn'});
        await workflowUtils.completeActivityUse(activity);
    } else if (config.rollItem) await workflowUtils.completeItemUse(item);
}
/**
 * Prompts to add nearby tokens as extra targets when an item matching certain criteria is used. Declining the prompt adds no targets.
 * The item or an activity on the item can optionally be rolled when additional targets are chosen.
 * This cannot be used with area of effect targeting.
 */
export const additionalTargets = {
    rules: 'all',
    version: '2.1.11',
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
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageType.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        healingType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.HealingType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.HealingType.Hint',
            get options() { return constants.healingTypeOptions; }
        },
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Common.Identifier.Hint'
        },
        itemType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemType.Hint',
            get options() { return constants.usableItemTypes; }
        },
        spellLevel: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellLevel.Hint',
            get options() { return constants.spellSlotOptions; }
        },
        sourceClasses: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.SourceClasses.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.SourceClasses.Hint'
        },
        spellSchool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchool.Hint',
            get options() { return constants.spellSchoolOptions; }
        },
        firstCastOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.FirstCast.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.FirstCast.Hint'
        },
        disposition: {
            default: 'ally',
            type: 'select',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.Disposition',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.Disposition.Hint',
            get options() { return [
                {value: 'all', label: _loc('CHRISPREMADES.Macros.Generic.Common.All')},
                {value: 'ally', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.MatchTarget')},
                {value: 'enemy', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.HostileTarget')},
                {value: 'neutral', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.NeutralTarget')}
            ]; }
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.Range.Hint'
        },
        rangeFrom: {
            default: 'target',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.RangeFrom.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.RangeFrom.Hint',
            get options() { return [
                {value: 'attacker', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.Attacker')},
                {value: 'target', label: _loc('CHRISPREMADES.Macros.Generic.AdditionalTargets.Target.Label')}
            ]; }
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Hint'
        },
        rollItem: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.RollItem.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Hint'
        },
        originalTargets: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.Original.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.Original.Hint'
        },
        targets: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.AdditionalTargets',
            hint: 'CHRISPREMADES.Macros.Generic.AdditionalTargets.Target.Hint'
        }
    }
};
