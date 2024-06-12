let packs = {
    spellFeatures: 'chris-premades.CPRSpellFeatures',
    spells: 'chris-premades.CPRSpells'
};
let featurePacks = {
    spellFeatures: 'chris-premades.CPRSpellFeatures'
};
function setUseLocalCompendium(value) {
    if (value) {
        packs.spellFeatures = 'world.cpr-spell-features';
        featurePacks.spellFeatures = 'world.cpr-spell-features';
        packs.spells = 'world.cpr-spells';
    } else {
        packs.spellFeatures = 'chris-premades.CPRSpellFeatures';
        featurePacks.spellFeatures = 'chris-premades.CPRSpellFeatures';
        packs.spells = 'chris-premades.CPRSpells';
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
        label: 'acid',
        value: 'Acid'
    },
    {
        label: 'bludgeoning',
        value: 'Bludgeoning'
    },
    {
        label: 'cold',
        value: 'Cold'
    },
    {
        label: 'fire',
        value: 'Fire'
    },
    {
        label: 'force',
        value: 'Force'
    },
    {
        label: 'lightning',
        value: 'Lightning'
    },
    {
        label: 'necrotic',
        value: 'Necrotic'
    },
    {
        label: 'none',
        value: 'No Type'
    },
    {
        label: 'piercing',
        value: 'Piercing'
    },
    {
        label: 'poison',
        value: 'Poison'
    },
    {
        label: 'psychic',
        value: 'Psychic'
    },
    {
        label: 'radiant',
        value: 'Radiant'
    },
    {
        label: 'slashing',
        value: 'Slashing'
    },
    {
        label: 'thunder',
        value: 'Thunder'
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
    setUseLocalCompendium
};