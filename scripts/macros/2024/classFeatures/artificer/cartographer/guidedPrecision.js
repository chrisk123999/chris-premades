import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
let spells = [
    'guidingBolt',
    'guiding-bolt',
    'mind-spike',
    'callLightning',
    'call-lightning'
];
async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!workflow.hitTargets.size) return;
    let sysID = workflow.item.system.identifier;
    let cprID = genericUtils.getIdentifier(workflow.item);
    let cartographerSpell = spells.some(s => sysID === s || cprID === s);
    let faerieTarget = !!workflow.attackRoll && workflow.hitTargets.some(t => t.actor.effects.some(e => !!e.flags['chris-premades']?.faerieFire && e.origin.includes(workflow.actor.id)));
    if (!cartographerSpell && !faerieTarget) return;
    if (itemUtils.getConfig(item, 'auto') || await dialogUtils.confirmUseItem(item)) {
        await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true});
        await workflowUtils.bonusDamage(workflow, workflow.actor.system.abilities.int.mod);
    }
}
async function damaged({trigger: {entity: item}, workflow, ditem}) {
    if (!workflow.hitTargets.size) return;
    if (ditem.oldHP === ditem.newHP && ditem.oldTempHP === ditem.newTempHP) return;
    if (!item.parent.concentration.items.some(i => genericUtils.getIdentifier(i) === 'faerieFire')) return;
    workflow.workflowOptions.noConcentrationCheck = true;
    await item.displayCard();
}
export let guidedPrecision = {
    name: 'Guided Precision',
    version: '1.5.16',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            },
            {
                pass: 'targetApplyDamage',
                macro: damaged,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'auto',
            label: 'CHRISPREMADES.SneakAttack.Auto',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ],
    ddbi: {
        correctedItems: {
            'Guided Precision': {
                system: {
                    uses: {
                        max: '1',
                        recovery: [
                            {
                                period: 'turn',
                                type: 'recoverAll'
                            }
                        ]
                    }
                }
            }
        }
    }
};
