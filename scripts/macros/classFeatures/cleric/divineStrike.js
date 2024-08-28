import {combatUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1 || workflow.isFumble || workflow.item.type !== 'weapon') return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'divineStrike');
    if (!originItem) return;
    let classLevels = workflow.actor.classes.cleric?.system?.levels;
    let subclassIdentifier = workflow.actor.classes.cleric?.subclass?.identifier;
    if (!classLevels || !subclassIdentifier) return;
    if (!combatUtils.perTurnCheck(originItem, 'divineStrike', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    let damageType = itemUtils.getConfig(originItem, 'damageType');
    if (!damageType || damageType === 'default') {
        switch (subclassIdentifier.split('-')[0]) {
            case 'death':
                damageType = 'necrotic';
                break;
            case 'forge':
                damageType = 'fire';
                break;
            case 'nature':
                damageType = await dialogUtils.buttonDialog(originItem.name, 'CHRISPREMADES.Config.DamageType', [
                    ['DND5E.DamageCold', 'cold'],
                    ['DND5E.DamageFire', 'fire'],
                    ['DND5E.DamageLightning', 'lightning']
                ]);
                damageType = damageType ?? 'cold';
                break;
            case 'order':
                damageType = 'psychic';
                break;
            case 'tempest':
                damageType = 'thunder';
                break;
            case 'trickery':
                damageType = 'poison';
                break;
            case 'war':
                damageType = workflow.defaultDamageType;
                break;
            default:
                damageType = 'radiant';
                break;
        }
    }
    let diceNumber = classLevels >= 14 ? 2 : 1;
    let bonusFormula = diceNumber + 'd8[' + damageType + ']';
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType});
    await combatUtils.setTurnCheck(originItem, 'divineStrike');
}
export let divineStrike = {
    name: 'Divine Strike',
    version: '0.12.40',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'default',
            category: 'homebrew',
            homebrew: true,
            options: () => Object.entries(CONFIG.DND5E.damageTypes).map(i => ({label: i[1].label, value: i[0]})).concat({label: 'DND5E.Default', value: 'default'})
        }
    ]
};