import {automationUtils, documentUtils} from '../../../proxy.mjs';
async function spendHitDice({document: item, actor, data}) {
    if (data.activity?.item !== item) return;
    const classItem = actor.classes?.[automationUtils.getConfigValue(item, 'classIdentifier')];
    if (!classItem) return;
    await documentUtils.update(classItem, {'system.hd.spent': Math.min(classItem.system.levels, classItem.system.hd.spent + 2)});
}
export const wiltingSmite = {
    name: 'Wilting Smite',
    version: '2.0.0',
    rules: '2024',
    called: [
        {
            pass: 'actorAttackRiderUsed',
            macro: spendHitDice,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'paladin',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
