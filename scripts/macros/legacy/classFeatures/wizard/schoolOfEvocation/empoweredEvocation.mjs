import {automationUtils, constants, DamageBonus, documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damage({document, workflow}) {
    if (workflow.item?.type !== 'spell') return;
    if (workflow.item.system.school !== 'evo') return;
    const multiSingleTarget = workflow.workflowOptions['chris-premades']?.multiSingleTarget;
    if (multiSingleTarget && document.flags['chris-premades']?.lastUse === multiSingleTarget.rollID) return;
    const ability = automationUtils.getConfigValue(document, 'spellcastingAbility');
    return new DamageBonus(document, {
        formula: '@abilities.' + ability + '.mod',
        optional: multiSingleTarget ? multiSingleTarget.remainingAttacks > 1 : false
    })
        .withOnUse(async () => {
            if (multiSingleTarget) await documentUtils.setFlag(document, 'chris-premades', 'lastUse', multiSingleTarget.rollID);
            await workflowUtils.completeItemUse(document);
        })
        .initialize();
}
export const empoweredEvocation = {
    name: 'Empowered Evocation',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 50
        }
    ],
    config: {
        spellcastingAbility: {
            default: 'int',
            type: 'select',
            get options() {
                return constants.abilityOptions();
            },
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew'
        }
    }
};
