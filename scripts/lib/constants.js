import {teleportEffects} from '../macros/animations/teleportEffects.js';
let packs = {
    spellFeatures: 'chris-premades.CPRSpellFeatures',
    spells: 'chris-premades.CPRSpells',
    summonFeatures: 'chris-premades.CPRSummonFeatures',
    summons: 'chris-premades.CPRSummons',
    items: 'chris-premades.CPRItems',
    classFeatures: 'chris-premades.CPRClassFeatures',
    classFeatureItems: 'chris-premades.CPRClassFeatureItems',
    actions: 'chris-premades.CPRActions',
    miscellaneousItems: 'chris-premades.CPRMiscellaneousItems',
    itemFeatures: 'chris-premades.CPRItemFeatures',
    feats: 'chris-premades.CPRFeats',
    raceFeatures: 'chris-premades.CPRRaceFeatures',
    thirdPartyClassFeatures: 'chris-premades.CPRThirdPartyClassFeatures',
    thirdPartyItems: 'chris-premades.CPRThirdPartyItems',
    monsterFeatures: 'chris-premades.CPRMonsterFeatures',
    miscellaneous: 'chris-premades.CPRMiscellaneous',
    thirdPartyFeats: 'chris-premades.CPRThirdPartyFeats',
    embeddedMacroSampleItems: 'chris-premades.CPREmbeddedMacroSampleItems'
};
let featurePacks = {
    spellFeatures: 'chris-premades.CPRSpellFeatures',
    summonFeatures: 'chris-premades.CPRSummonFeatures',
    classFeatureItems: 'chris-premades.CPRClassFeatureItems',
    miscellaneousItems: 'chris-premades.CPRMiscellaneousItems',
    itemFeatures: 'chris-premades.CPRItemFeatures',
    featFeatures: 'chris-premades.CPRFeatFeatures'
};
let legacyPacks = {
    spells: 'chris-premades.CPRSpells',
    items: 'chris-premades.CPRItems',
    classFeatures: 'chris-premades.CPRClassFeatures',
    actions: 'chris-premades.CPRActions',
    feats: 'chris-premades.CPRFeats',
    raceFeatures: 'chris-premades.CPRRaceFeatures',
    thirdPartyClassFeatures: 'chris-premades.CPRThirdPartyClassFeatures',
    thirdPartyItems: 'chris-premades.CPRThirdPartyItems',
    monsterFeatures: 'chris-premades.CPRMonsterFeatures',
    thirdPartyFeats: 'chris-premades.CPRThirdPartyFeats'
};
let modernPacks = {
    spells: 'chris-premades.CPRSpells2024',
    classFeatures: 'chris-premades.CPRClassFeatures2024',
    items: 'chris-premades.CPRItems2024',
    summonFeatures: 'chris-premades.CPRSummonFeatures2024',
    summons: 'chris-premades.CPRSummons2024',
    featFeatures: 'chris-premades.CPRFeatFeatures2024',
    feats: 'chris-premades.CPRFeats2024',
    actions: 'chris-premades.CPRActions2024'
};
function setUseLocalCompendium(value) {
    if (value) {
        packs.spellFeatures = 'world.cpr-spell-features';
        featurePacks.spellFeatures = 'world.cpr-spell-features';
        packs.spells = 'world.cpr-spells';
        packs.summonFeatures = 'world.cpr-summon-features';
        featurePacks.summonFeatures = 'world.cpr-summon-features';
        packs.summons = 'world.cpr-summons';
        packs.items = 'world.cpr-items';
        packs.classFeatures = 'world.cpr-class-features';
        packs.classFeatureItems = 'world.cpr-class-feature-items';
        featurePacks.classFeatureItems = 'world.cpr-class-feature-items';
        packs.actions = 'world.cpr-actions';
        packs.miscellaneousItems = 'world.cpr-miscellaneous-items';
        featurePacks.miscellaneousItems = 'world.cpr-miscellaneous-items';
        packs.itemFeatures = 'world.cpr-item-features';
        featurePacks.itemFeatures = 'world.cpr-item-features';
        packs.feats = 'world.cpr-feats';
        packs.raceFeatures = 'world.cpr-race-features';
        packs.thirdPartyClassFeatures = 'world.cpr-3rd-party-class-features';
        packs.thirdPartyItems = 'world.cpr-3rd-party-items';
        packs.monsterFeatures = 'world.cpr-monster-features';
        packs.miscellaneous = 'world.cpr-miscellaneous';
        packs.thirdPartyFeats = 'world.cpr-3rd-party-feats';
        modernPacks.spells = 'world.cpr-spells-2024';
        modernPacks.classFeatures = 'world.cpr-class-features-2024';
        modernPacks.items = 'world.cpr-items-2024';
        modernPacks.summonFeatures =  'world.cpr-summon-features-2024';
        modernPacks.summons = 'world.cpr-summons-2024';
        modernPacks.featFeatures = 'world.cpr-feat-features-2024';
        modernPacks.feats = 'world.cpr-feat-feats-2024';
        packs.embeddedMacroSampleItems = 'world.cpr-embedded-macro-sample-items';
        modernPacks.actions = 'world.cpr-actions-2024';
    } else {
        packs.spellFeatures = 'chris-premades.CPRSpellFeatures';
        featurePacks.spellFeatures = 'chris-premades.CPRSpellFeatures';
        packs.spells = 'chris-premades.CPRSpells';
        packs.summonFeatures = 'chris-premades.CPRSummonFeatures';
        featurePacks.summonFeatures = 'chris-premades.CPRSummonFeatures';
        packs.summons = 'chris-premades.CPRSummons';
        packs.items = 'chris-premades.CPRItems';
        packs.classFeatures = 'chris-premades.CPRClassFeatures';
        packs.classFeatureItems = 'chris-premades.CPRClassFeatureItems';
        featurePacks.classFeatureItems = 'chris-premades.CPRClassFeatureItems';
        packs.actions = 'chris-premades.CPRActions';
        packs.miscellaneousItems = 'chris-premades.CPRMiscellaneousItems';
        featurePacks.miscellaneousItems = 'chris-premades.CPRMiscellaneousItems';
        packs.itemFeatures = 'chris-premades.CPRItemFeatures';
        featurePacks.itemFeatures = 'chris-premades.CPRItemFeatures';
        packs.feats = 'chris-premades.CPRFeats';
        packs.raceFeatures = 'chris-premades.CPRRaceFeatures';
        packs.thirdPartyClassFeatures = 'chris-premades.CPRThirdPartyClassFeatures';
        packs.thirdPartyItems = 'chris-premades.CPRThirdPartyItems';
        packs.monsterFeatures = 'chris-premades.CPRMonsterFeatures';
        packs.miscellaneous = 'chris-premades.CPRMiscellaneous';
        packs.thirdPartyFeats = 'chris-premades.CPRThirdPartyFeats';
        modernPacks.spells = 'chris-premades.CPRSpells2024';
        modernPacks.classFeatures = 'chris-premades.CPRClassFeatures2024';
        modernPacks.items = 'chris-premades.CPRItems2024';
        modernPacks.summonFeatures=  'chris-premades.CPRSummonFeatures2024';
        modernPacks.summons = 'chris-premades.CPRSummons2024';
        modernPacks.featFeatures = 'chris-premades.cpr-feat-features-2024';
        modernPacks.feats = 'chris-premades.cpr-feat-feats-2024';
        packs.embeddedMacroSampleItems = 'chris-premades.CPREmbeddedMacroSampleItems';
        modernPacks.actions = 'chris-premades.CPRActions2024';
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
const rangedWeaponAttacks = [
    'rwak'
];
const meleeWeaponAttacks = [
    'mwak'
];
const unarmedAttacks = [
    'unarmedStrike',
    'monkUnarmedStrike',
    'tavernBrawlerUnarmedStrike',
    'fightingStyleUnarmedFightingUnarmedStrike',
    'predatoryStrike',
    'unarmedFightingUnarmedStrike',
    'formOfTheBeast'
];
const weaponTypes = [
    'martialM',
    'simpleM',
    'martialR',
    'simpleR'
];
const meleeWeaponTypes = [
    'martialM',
    'simpleM'
];
const rangedWeaponTypes = [
    'martialR',
    'simpleR'
];
const armorTypes = [
    'light',
    'medium',
    'heavy'
];
const damageTypeOptions = () => Object.entries(CONFIG.DND5E.damageTypes).map(i => ({label: i[1].label, value: i[0]}));
const creatureTypeOptions = () => Object.entries(CONFIG.DND5E.creatureTypes).map(i => ({label: i[1].label, value: i[0]}));
const actorCompendiumPacks = () => [{label: '', value: ''}, ...game.packs.filter(i => i.documentName === 'Actor').map(i => ({label: i.metadata.label, value: i.metadata.id}))];
const itemCompendiumPacks = () => [{label: '', value: ''}, ...game.packs.filter(i => i.documentName === 'Item').map(i => ({label: i.metadata.label, value: i.metadata.id}))];
const abilityOptions = () => Object.entries(CONFIG.DND5E.abilities).map(i => ({label: i[1].label, value: i[0]}));
const healingTypeOptions = () => Object.entries(CONFIG.DND5E.healingTypes).map(i => ({label: i[1].label, value: i[0]}));
const statusOptions = () => CONFIG.statusEffects.map(i => ({label: i.name, value: i.id}));
const skillOptions = () => Object.entries(CONFIG.DND5E.skills).map(i => ({label: i[1].label, value: i[0]}));
const diceSizeOptions = [4, 6, 8, 10, 12, 20].map(i => ({label: 'd' + i, value: 'd' + i}));
const teleportOptions = () => Object.entries(teleportEffects).map(i => ({label: i[1].name, value: i[0]}));
const itemProperties = () => Object.entries(CONFIG.DND5E.itemProperties).map(i => ({label: i[1].label, value: i[0]}));
const armorOptions = () => Object.entries(CONFIG.DND5E.armorTypes).map(i => ({label: i[1], value: i[0]}));
const spellSchoolOptions = () => Object.entries(CONFIG.DND5E.spellSchools).map(i => ({label: i[1].label, value: i[0]}));
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
        key: 'name',
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
                label: 'DND5E.SavingThrow',
                value: 'save'
            },
            {
                label: 'CHRISPREMADES.Generic.Skill',
                value: 'skill'
            },
            {
                label: 'DND5E.None',
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
        type: 'select',
        options: [
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.ActionSaveDisabled',
                value: false
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.ActionSaveRoll',
                value: 'roll'
            },
            {
                label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.ActionSaveDialog',
                value: 'dialog'
            }
        ],
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
        label: 'CHRISPREMADES.Config.Animations.Default',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'celestial',
        label: 'CHRISPREMADES.Config.Animations.Celestial',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'fiend',
        label: 'CHRISPREMADES.Config.Animations.Fiend',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'fire',
        label: 'CHRISPREMADES.Config.Animations.Fire',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'water',
        label: 'CHRISPREMADES.Config.Animations.Water',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'air',
        label: 'CHRISPREMADES.Config.Animations.Air',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'earth',
        label: 'CHRISPREMADES.Config.Animations.Earth',
        requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
    },
    {
        value: 'nature',
        label: 'CHRISPREMADES.Config.Animations.Nature',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'shadow',
        label: 'CHRISPREMADES.Config.Animations.Shadow',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'smoke',
        label: 'CHRISPREMADES.Config.Animations.Smoke',
        requiredModules: []
    },
    {
        value: 'future',
        label: 'CHRISPREMADES.Config.Animations.Future',
        requiredModules: ['jb2a_patreon']
    },
    {
        value: 'none',
        label: 'CHRISPREMADES.Config.Animations.None',
        requiredModules: []
    }
];
const sizes = {
    tiny: 0,
    small: 1,
    medium: 2,
    large: 3,
    huge: 4,
    gargantuan: 5
};
const itemTypes =  [
    'weapon',
    'equipment',
    'consumable',
    'tool',
    'backpack',
    'loot'
];
const tempConditionIcon = 'icons/magic/time/arrows-circling-green.webp';
const immuneEffectData = {
    name: 'Immune',
    img: tempConditionIcon,
    duration: {
        turns: 1
    },
    changes: [
        {
            key: 'flags.midi-qol.min.ability.save.all',
            value: 100,
            mode: 5,
            priority: 120
        }
    ],
    flags: {
        dae: {
            specialDuration: [
                'isSave'
            ]
        },
        'chris-premades': {
            effect: {
                noAnimation: true
            }
        }
    }
};
const advantageEffectData = {
    name: 'Advantage',
    img: tempConditionIcon,
    duration: {
        turns: 1
    },
    changes: [
        {
            key: 'flags.midi-qol.advantage.ability.save.all',
            value: 1,
            mode: 5,
            priority: 120
        }
    ],
    flags: {
        dae: {
            specialDuration: [
                'isSave'
            ]
        },
        'chris-premades': {
            effect: {
                noAnimation: true
            }
        }
    }
};
const disadvantageEffectData = {
    name: 'Disadvantage',
    img: tempConditionIcon,
    duration: {
        turns: 1
    },
    changes: [
        {
            key: 'flags.midi-qol.disadvantage.ability.save.all',
            value: 1,
            mode: 5,
            priority: 120
        }
    ],
    flags: {
        dae: {
            specialDuration: [
                'isSave'
            ]
        },
        'chris-premades': {
            effect: {
                noAnimation: true
            }
        }
    }
};
const autoFailSaveEffectData = {
    name: 'Auto Fail',
    img: tempConditionIcon,
    duration: {
        seconds: 1
    },
    changes: [
        {
            key: 'flags.midi-qol.fail.ability.save.all',
            value: 1,
            mode: 0,
            priority: 20
        }
    ],
    flags: {
        dae: {
            specialDuration: [
                'isSave'
            ]
        }
    }
};
let languageOptions = () => {
    function extractLanguages(obj) {
        let result = [];
        function recurse(node, key, depth = 0) {
            if (!node) return;
            if (typeof node === 'string') {
                result.push({ value: key, label: node});
            } else if (typeof node === 'object') {
                if (node.label && key && depth > 0) {
                    result.push({value: key, label: node.label});
                }
                if (node.children) {
                    for (let [childKey, childValue] of Object.entries(node.children)) {
                        recurse(childValue, childKey, depth + 1);
                    }
                }
            }
        }
        for (let [key, value] of Object.entries(obj)) {
            recurse(value, key, 0);
        }
        return result;
    }
    return extractLanguages(CONFIG.DND5E.languages).sort((a, b) => a.label.localeCompare(b.label, 'en', {'sensitivity': 'base'}));
};
export let constants = {
    packs,
    featurePacks,
    attacks,
    meleeAttacks,
    rangedAttacks,
    weaponAttacks,
    spellAttacks,
    unarmedAttacks,
    weaponTypes,
    meleeWeaponTypes,
    rangedWeaponTypes,
    armorTypes,
    damageTypeOptions,
    creatureTypeOptions,
    actorCompendiumPacks,
    itemCompendiumPacks,
    setUseLocalCompendium,
    overTimeOptions,
    summonAnimationOptions,
    sizes,
    itemTypes,
    tempConditionIcon,
    abilityOptions,
    healingTypeOptions,
    legacyPacks,
    modernPacks,
    immuneEffectData,
    diceSizeOptions,
    advantageEffectData,
    statusOptions,
    skillOptions,
    teleportOptions,
    itemProperties,
    armorOptions,
    spellSchoolOptions,
    autoFailSaveEffectData,
    disadvantageEffectData,
    languageOptions,
    rangedWeaponAttacks,
    meleeWeaponAttacks
};