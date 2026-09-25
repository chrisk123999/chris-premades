import {automationUtils, constants, documentUtils, genericUtils} from '../../../../../proxy.mjs';
const bonusActions = ['dash', 'disengage', 'dodge', 'help'];
async function beast({document, summon, updates}) {
    const source = summon.sourceDocument;
    if (documentUtils.getIdentifier(source?.item ?? source) !== 'primal-companion') return;
    const damageType = automationUtils.getConfigValue(document, 'damageType');
    updates.items ??= (await summon.getSourceActor()).items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        const isBonusAction = bonusActions.includes(itemData.system.identifier);
        Object.values(itemData.system.activities ?? {}).forEach(activityData => {
            if (isBonusAction) genericUtils.setProperty(activityData, 'activation.type', 'bonus');
            if (activityData.type !== 'attack') return;
            activityData.damage?.parts?.forEach(part => {
                if (!part.types.includes(damageType)) part.types.push(damageType);
            });
        });
    });
}
export const exceptionalTraining = {
    name: 'Exceptional Training',
    version: '2.0.0',
    rules: '2024',
    summon: [
        {
            pass: 'actorPreCreate',
            macro: beast,
            priority: 50
        }
    ],
    config: {
        damageType: {
            default: 'force',
            type: 'select',
            get options() {
                return constants.damageTypeOptions();
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
