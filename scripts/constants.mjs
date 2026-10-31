const packs = {
    legacy: {
        summons: 'chris-premades.CPRSummons2014',
        features: 'chris-premades.CPRFeatures2014',
        monsterFeatures: 'chris-premades.CPRMonsterFeatures2014',
        spells: 'chris-premades.CPRSpells2014',
        equipment: 'chris-premades.CPREquipment2014',
        misc: 'chris-premades.CPRMisc2014'
    },
    modern: {
        summons: 'chris-premades.CPRSummons2024',
        features: 'chris-premades.CPRFeatures2024',
        monsterFeatures: 'chris-premades.CPRMonsterFeatures2024',
        spells: 'chris-premades.CPRSpells2024',
        equipment: 'chris-premades.CPREquipment2024',
        misc: 'chris-premades.CPRMisc2024'
    },
    samples: {
        embeddedMacros: 'chris-premades.CPREmbeddedMacroSampleItems'
    },
    misc: {
        automationItems: 'chris-premades.CPRAutomationItems'
    }
};
const sangromancyFeatures = [
    'full-blooded',
    'stage-3-boon-sangromancy-specialist',
    'sangromantic-initiate',
    'stolen-power'
];
const firearmProperties = ['barrel', 'blackpowder', 'blaring', 'burstFire', 'cumbersome', 'explosive', 'loud', 'magazine', 'recoil', 'spreadFire', 'twinnedBarrel'];
const firearmBaseItems = {
    'automaticrifle': packs.modern.equipment + '.Item.wZSoPUAn0IoSPkRu',
    'badnews(exandria)': packs.legacy.equipment + '.Item.6Lm04WMHVTQIN50N',
    'blunderbuss(exandria)': packs.legacy.equipment + '.Item.gz6fDX6AuHwDxxfv',
    "blunderbuss(steinhardt's)": packs.modern.equipment + '.Item.6E7HX15SzQib5Egh',
    'double-barrelshotgun': packs.modern.equipment + '.Item.TWKFAYmarI1KzNUK',
    'dragonrifle': packs.modern.equipment + '.Item.xSmYYQuQvZwA4POJ',
    'firearm': packs.legacy.equipment + '.Item.S6EfIHKwg8Kr3RlR',
    'flamebellows': packs.modern.equipment + '.Item.GHckXApVRl89MF8E',
    'handmortar(exandria)': packs.legacy.equipment + '.Item.KpL1leRKu6jzGerx',
    'musket(exandria)': packs.legacy.equipment + '.Item.sJG9JDQhAc2VfyOQ',
    'palmpistol(exandria)': packs.legacy.equipment + '.Item.UbDuVXbYibJ44oRx',
    'pepperbox(exandria)': packs.legacy.equipment + '.Item.GJj7uoYSgmlUhLeN',
    'pistol(exandria)': packs.legacy.equipment + '.Item.pLDHC6XfYnxNMqPv'
};
const darknessAnimationConfig = {
    default: '',
    type: 'select',
    label: 'CHRISPREMADES.Config.DarknessAnimation',
    hint: 'CHRISPREMADES.Config.DarknessAnimationHint',
    category: 'mechanics',
    get options() {
        return [{value: '', label: _loc('DND5E.None')}, ...Object.entries(CONFIG.Canvas.darknessAnimations).map(([value, config]) => ({value, label: config.label}))];
    }
};
export default {
    packs,
    sangromancyFeatures,
    firearmProperties,
    firearmBaseItems,
    darknessAnimationConfig
};