import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
export async function arcaneJoltHelper(workflow, originItem) {
    let targetToken = workflow.hitTargets.first();
    let scale = originItem.actor.system?.scale?.['battle-smith']?.['arcane-jolt']?.formula;
    if (!scale) return;
    let selection = await dialogUtils.buttonDialog(originItem.name, 'CHRISPREMADES.Macros.ArcaneJolt.HarmOrHeal', [
        ['CHRISPREMADES.Macros.ArcaneJolt.Harm', 'harm'],
        ['CHRISPREMADES.Macros.ArcaneJolt.Heal', 'heal'],
        ['DND5E.None', false]
    ]);
    if (!selection?.length) return;
    if (selection === 'harm') {
        await workflowUtils.bonusDamage(workflow, scale + '[force]', {damageType: 'force'});
    } else {
        let nearbyTargets = tokenUtils.findNearby(targetToken, 30, 'enemy');
        if (!nearbyTargets) return;
        let selected = await dialogUtils.selectTargetDialog(originItem.name, 'CHRISPREMADES.Macros.ArcaneJolt.WhoHeal', nearbyTargets);
        if (!selected?.length) return;
        let target = selected[0];
        let damageRoll = await new CONFIG.Dice.DamageRoll(scale + '[healing]', {}, {type: 'healing'}).evaluate();
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'healing', [target], {flavor: originItem.name, itemCardId: workflow.chatCard.id, sourceItem: originItem});
    }
    await combatUtils.setTurnCheck(originItem, 'arcaneJolt');
    await workflowUtils.completeItemUse(originItem, {consumeUsage: true}, {configureDialog: false});
}
async function damage({trigger, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (!workflow.item.system.properties.has('mgc')) return;
    if (!combatUtils.perTurnCheck(trigger.entity, 'arcaneJolt')) return;
    if (!trigger.entity.system.uses.value) return;
    await arcaneJoltHelper(workflow, trigger.entity);
}
async function updateScales(origItem, newItemData) {
    let { scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, arcaneJolt.scaleAliases, 'battle-smith');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'flags.chris-premades.config.scaleIdentifier', scaleIdentifier);
}
export let arcaneJolt = {
    name: 'Arcane Jolt',
    version: '1.1.0',
    scaleAliases: ['arcane-jolt', 'jolt'],
    early: updateScales,
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
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'battle-smith',
            category: 'mechanics'
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'arcane-jolt',
            category: 'mechanics'
        }
    ]
};