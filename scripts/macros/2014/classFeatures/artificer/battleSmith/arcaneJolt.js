import {combatUtils, constants, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
export async function arcaneJoltHelper(workflow, originItem) {
    let targetToken = workflow.hitTargets.first();
    let subclassIdentifier = itemUtils.getConfig(originItem, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(originItem, 'scaleIdentifier');
    let scale = originItem.actor.system?.scale?.[subclassIdentifier]?.[scaleIdentifier]?.formula;
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
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!workflow.item.system.properties.has('mgc')) return;
    if (!combatUtils.perTurnCheck(trigger.entity, 'arcaneJolt')) return;
    if (!trigger.entity.system.uses.value) return;
    await arcaneJoltHelper(workflow, trigger.entity);
}
async function added({trigger: {entity: item}}) {
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[subclassIdentifier]?.['jolt']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'jolt');
        return;
    }
    await itemUtils.fixScales(item);
}
export let arcaneJolt = {
    name: 'Arcane Jolt',
    version: '1.3.57',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    config: [
        {
            value: 'subclassIdentifier',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
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
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'arcane-jolt',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        9: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        15: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Arcane Jolt'
            }
        }
    ]
};