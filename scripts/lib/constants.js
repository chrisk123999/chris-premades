let packs = {
    spellFeatures: 'chris-premades.CPRSpellFeatures',
    spells: 'chris-premades.CPRSpells',
    summonFeatures: 'chris-premades.CPRSummonFeatures',
    summons: 'chris-premades.CPRSummons'
};
let featurePacks = {
    spellFeatures: 'chris-premades.CPRSpellFeatures',
    summonFeatures: 'chris-premades.CPRSummonFeatures'
};
function setUseLocalCompendium(value) {
    if (value) {
        packs.spellFeatures = 'world.cpr-spell-features';
        featurePacks.spellFeatures = 'world.cpr-spell-features';
        packs.spells = 'world.cpr-spells';
        packs.summonFeatures = 'world.cpr-summon-features';
        featurePacks.summonFeatures = 'world.cpr-summon-features';
        packs.summons = 'world.cpr-summons';
    } else {
        packs.spellFeatures = 'chris-premades.CPRSpellFeatures';
        featurePacks.spellFeatures = 'chris-premades.CPRSpellFeatures';
        packs.spells = 'chris-premades.CPRSpells';
        packs.summonFeatures = 'chris-premades.CPRSummonFeatures';
        featurePacks.summonFeatures = 'chris-premades.CPRSummonFeatures';
        packs.summons = 'chris-premades.CPRSummons';
    }
}
const attacks = [
    'msak',
    'rsak',
    'mwak',
    'rwak'
];
const meleeAttacks = [
    'mwak',
    'msak'
];
const rangedAttacks = [
    'rwak',
    'rsak'
];
const weaponAttacks = [
    'mwak',
    'rwak'
];
const spellAttacks = [
    'msak',
    'rsak'
];
const damageTypes = [
    'acid',
    'bludgeoning',
    'cold',
    'fire',
    'force',
    'lightning',
    'necrotic',
    'none',
    'piercing',
    'poison',
    'psychic',
    'radiant',
    'slashing',
    'thunder'
];
let damageTypeOptions = [
    {
        label: 'Acid',
        value: 'acid'
    },
    {
        label: 'Bludgeoning',
        value: 'bludgeoning'
    },
    {
        label: 'Cold',
        value: 'cold'
    },
    {
        label: 'Fire',
        value: 'fire'
    },
    {
        label: 'Force',
        value: 'force'
    },
    {
        label: 'Lightning',
        value: 'lightning'
    },
    {
        label: 'Necrotic',
        value: 'necrotic'
    },
    {
        label: 'No Type',
        value: 'none'
    },
    {
        label: 'Piercing',
        value: 'piercing'
    },
    {
        label: 'Poison',
        value: 'poison'
    },
    {
        label: 'Psychic',
        value: 'psychic'
    },
    {
        label: 'Radiant',
        value: 'radiant'
    },
    {
        label: 'Slashing',
        value: 'slashing'
    },
    {
        label: 'Thunder',
        value: 'thunder'
    }
];

const overTimeOptions = [
    {
        key: 'turn',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Turn',
        default: 'start',
        type: 'radio',
        options: [
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Start',
                value: 'start'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.End',
                value: 'end'
            }
        ],
        fieldset: 'parameters'
    },
    {
        key: 'label',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Label',
        default: null,
        type: 'text',
        fieldset: 'parameters'
    },
    {
        key: 'allowIncapacitated',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.AllowIncapacitated',
        default: true,
        type: 'boolean',
        fieldset: 'parameters'
    },
    {
        key: 'applyCondition',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.ApplyCondition',
        default: null,
        type: 'text',
        fieldset: 'parameters',
    },
    {
        key: 'removeCondition',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.RemoveCondition',
        default: null,
        type: 'text',
        fieldset: 'parameters'
    },
    {
        key: 'rollType',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.RollType',
        default: false,
        type: 'select',
        options: [
            {
                label: 'CHRISPREMADES.Generic.Check',
                value: 'check'
            },
            {
                label: 'CHRISPREMADES.Generic.Save',
                value: 'save'
            },
            {
                label: 'CHRISPREMADES.Generic.Skill',
                value: 'skill'
            },
            {
                label: 'CHRISPREMADES.Generic.None',
                value: false
            }
        ],
        fieldset: 'rolls'
    },
    {
        key: 'saveAbility',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveAbility',
        default: null,
        type: 'abilityOrSkill',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'saveDC',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveDC',
        default: null,
        type: 'saves',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'saveDCNumber',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveDCNumber',
        default: null,
        type: 'text',
        requires: 'other',
        fieldset: 'rolls'
    },
    {
        key: 'saveDCAbility',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveDCAbility',
        default: 'str',
        type: 'ability',
        requires: 'other',
        fieldset: 'rolls'
    },
    {
        key: 'saveDamage',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveDamage',
        default: 'nodamage',
        type: 'select',
        options: [
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.HalfDamage',
                value: 'halfdamage'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.NoDamage',
                value: 'nodamage'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.FullDamage',
                value: 'fulldamage'
            }
        ],
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'saveRemove',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveRemove',
        default: true,
        type: 'boolean',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'saveMagic',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SaveMagic',
        default: false,
        type: 'boolean',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'actionSave',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.ActionSave',
        default: false,
        type: 'boolean',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'damageBeforeSave',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.DamageBeforeSave',
        default: false,
        type: 'boolean',
        requires: 'rollType',
        fieldset: 'rolls'
    },
    {
        key: 'damageRoll',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.DamageRoll',
        default: null,
        type: 'text',
        fieldset: 'damage'
    },
    {
        key: 'damageType',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.DamageType',
        default: null,
        type: 'damageTypes',
        requires: 'damageRoll',
        fieldset: 'damage'
    },
    {
        key: 'rollMode',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.RollMode',
        default: 'publicroll',
        type: 'select',
        options: [
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.GMRoll',
                value: 'gmroll'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.BlindRoll',
                value: 'blindroll'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.PublicRoll',
                value: 'publicroll'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.SelfRoll',
                value: 'selfroll'
            }
        ],
        fieldset: 'damage'
    },
    {
        key: 'macro',
        label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Macro',
        default: null,
        type: 'text',
        fieldset: 'macros'
    }
];
const summonAnimationOptions = [
    {
        value: 'default',
        label: 'CHRISPREMADES.config.animations.default',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'celestial',
        label: 'CHRISPREMADES.config.animations.celestial',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'fiend',
        label: 'CHRISPREMADES.config.animations.fiend',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'fire',
        label: 'CHRISPREMADES.config.animations.fire',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'water',
        label: 'CHRISPREMADES.config.animations.water',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'air',
        label: 'CHRISPREMADES.config.animations.air',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'earth',
        label: 'CHRISPREMADES.config.animations.earth',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'nature',
        label: 'CHRISPREMADES.config.animations.nature',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'shadow',
        label: 'CHRISPREMADES.config.animations.shadow',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'future',
        label: 'CHRISPREMADES.config.animations.future',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'none',
        label: 'CHRISPREMADES.config.animations.none',
        requiredModules: []
    }
];
export let constants = {
    packs,
    featurePacks,
    attacks,
    meleeAttacks,
    rangedAttacks,
    weaponAttacks,
    spellAttacks,
    damageTypes,
    damageTypeOptions,
    setUseLocalCompendium,
    overTimeOptions,
    summonAnimationOptions
};