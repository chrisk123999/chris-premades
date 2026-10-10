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
    darknessAnimationConfig
};