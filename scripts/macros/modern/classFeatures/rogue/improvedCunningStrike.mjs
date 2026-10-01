import {automationUtils} from '../../../../proxy.mjs';
async function limit({document: item, data: {tag}}) {
    if (tag !== 'cunningStrike') return 0;
    return automationUtils.getConfigValue(item, 'uses');
}
export const improvedCunningStrike = {
    name: 'Improved Cunning Strike',
    version: '2.0.1',
    rules: '2024',
    called: [
        {
            pass: 'actorAttackRiderLimit',
            macro: limit,
            priority: 50
        }
    ],
    config: {
        uses: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Config.SimultaneousUses',
            category: 'homebrew'
        }
    }
};
