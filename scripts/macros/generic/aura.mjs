import {automationUtils, constants, documentUtils} from '../../proxy.mjs';
const triggerKeys = {
    enter: 'enterActivity',
    exit: 'exitActivity',
    turnStart: 'turnStartActivity',
    turnEnd: 'turnEndActivity'
};
function getFilter(value) {
    if (!value) return;
    const [kind, ...rest] = value.split('|');
    if (kind === 'embedded') return rest.join('|');
    const [rules, ...identifier] = rest;
    return {source: kind, rules, identifier: identifier.join('|')};
}
function filterOptions(document, flags) {
    const registered = new Map();
    [true, false].flatMap(genericOnly => constants.macros.getAllMacros({genericOnly})).forEach(macro => {
        if (!macro.macros.aura?.some(entry => entry.pass === 'filter')) return;
        registered.set(macro.source + '|' + macro.rules + '|' + macro.identifier, macro.identifier + ' (' + macro.source + ', ' + macro.rules + ')');
    });
    const embedded = (flags?.embeddedMacros ?? document?.flags?.cat?.embeddedMacros ?? []).filter(macro => macro.event === 'aura' && macro.pass === 'filter');
    return [
        {value: '', label: 'CHRISPREMADES.Config.None'},
        ...Array.from(registered.entries()).map(([value, label]) => ({value, label})),
        ...embedded.map(macro => ({value: 'embedded|' + macro.name, label: macro.name}))
    ];
}
function descriptor({document}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'aura', configKeys);
    const base = {
        id: documentUtils.getIdentifier(document) || document.name?.slugify() || 'aura',
        radius: config.radius,
        dispositions: config.dispositions,
        includeSelf: config.includeSelf,
        sourceDisable: config.sourceDisable,
        targetDisable: config.targetDisable,
        creatureTypes: config.creatureTypes,
        sourceStatuses: config.sourceStatuses,
        walls: config.walls,
        effect: config.effect,
        value: config.value ? {formula: config.value, stacking: config.stackHighest ? 'highest' : 'nearest'} : undefined,
        triggers: Object.entries(triggerKeys).filter(([, key]) => config[key]).map(([event, key]) => ({event, activity: config[key], oncePerTurn: config.oncePerTurn})),
        filter: getFilter(config.filter)
    };
    if (!config.enemyEffect) return base;
    return [
        {...base, dispositions: ['ally']},
        {...base, id: base.id + '-enemy', dispositions: ['enemy'], effect: config.enemyEffect}
    ];
}
export const aura = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item', 'activity', 'activeeffect'],
    aura: [
        {
            pass: 'descriptor',
            macro: descriptor,
            priority: 50
        }
    ],
    genericConfig: {
        radius: {
            default: '30',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.Radius',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.RadiusHint'
        },
        dispositions: {
            default: ['ally'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Dispositions',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.DispositionsHint',
            get options() { return constants.dispositionOptions; }
        },
        includeSelf: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.IncludeSelf',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.IncludeSelfHint'
        },
        sourceDisable: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.SourceDisable',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.SourceDisableHint',
            get options() { return constants.statusOptions; }
        },
        targetDisable: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.TargetDisable',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.TargetDisableHint',
            get options() { return constants.statusOptions; }
        },
        creatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.CreatureTypesHint',
            get options() { return constants.creatureTypeOptions; }
        },
        sourceStatuses: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.SourceStatuses',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.SourceStatusesHint',
            get options() { return constants.statusOptions; }
        },
        walls: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.Walls',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.WallsHint'
        },
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Effect',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.EffectHint'
        },
        enemyEffect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.EnemyEffect',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.EnemyEffectHint'
        },
        value: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.Value',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.ValueHint'
        },
        stackHighest: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.StackHighest',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.StackHighestHint'
        },
        enterActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.EnterActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.EnterActivityHint'
        },
        exitActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.ExitActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.ExitActivityHint'
        },
        turnStartActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.TurnStartActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.TurnStartActivityHint'
        },
        turnEndActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.TurnEndActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.TurnEndActivityHint'
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.OncePerTurn',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.OncePerTurnHint'
        },
        filter: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Aura.Filter',
            hint: 'CHRISPREMADES.Macros.Generic.Aura.FilterHint',
            options: filterOptions
        }
    }
};
const configKeys = Object.keys(aura.genericConfig);
