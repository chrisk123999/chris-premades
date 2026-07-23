import {automationUtils, itemUtils} from '../../../proxy.mjs';
async function recoveryBonus({document: item}) {
    if (!itemUtils.getEquipmentState(item)) return;
    const bonus = automationUtils.getConfigValue(item, 'bonus') ?? 0;
    if (!bonus) return;
    return {bonus};
}
export const arcaneGrimoire = {
    name: 'Arcane Grimoire',
    version: '2.0.0',
    rules: 'all',
    called: [
        {
            pass: 'actorArcaneRecoveryBonus',
            macro: recoveryBonus,
            priority: 50
        }
    ],
    config: {
        bonus: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.ArcaneGrimoire',
            category: 'homebrew'
        }
    }
};
