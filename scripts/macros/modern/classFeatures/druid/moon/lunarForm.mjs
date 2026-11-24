import {automationUtils, constants, genericUtils} from '../../../../../proxy.mjs';
function transformed({document: item, data}) {
    const macros = genericUtils.getProperty(data.effectData, 'flags.cat.macros.roll') ?? [];
    macros.push({source: 'chris-premades', rules: 'all', identifier: 'damageBonusToOneRoll'});
    genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', macros);
    genericUtils.setProperty(data.effectData, 'flags.cat.genericConfig.chris-premades.damageBonusToOneRoll', {
        bonus: automationUtils.getConfigValue(item, 'formula') ?? lunarForm.config.formula.default,
        bonusDamageType: [automationUtils.getConfigValue(item, 'damageType') ?? lunarForm.config.damageType.default],
        attackType: 'weaponAttack',
        maxTargets: 1,
        requireHit: true,
        oncePerTurn: true,
        allowCritical: true
    });
}
export const lunarForm = {
    name: 'Lunar Form',
    version: '2.1.11',
    rules: '2024',
    called: [
        {
            pass: 'actorWildShape',
            macro: transformed,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '2d10',
            type: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'radiant',
            type: 'select',
            get options() {
                return constants.damageTypeOptions;
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
