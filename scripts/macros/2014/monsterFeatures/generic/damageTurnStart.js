import {actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (!workflow.failedSaves.size) return;
    if (!workflow.item.effects.size) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.NoEffect', {itemName: workflow.item.name}), 'info');
        return;
    }
    for (let target of workflow.failedSaves) {
        let effect = await Array.from(target.actor.allApplicableEffects()).find(async i => (await effectUtils.getOriginItem(i))?.uuid === workflow.item.uuid);
        if (!effect) continue;
        let effectData = {
            name: workflow.item.name + ': ' + target.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            flags: {
                'chris-premades': {
                    damageTurnStart: {
                        token: target.id
                    },
                    effect: {
                        noAnimation: true
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'combat', ['damageTurnStart']);
        await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: effect, strictlyInterdependent: true});
    }
}
async function turnStart({trigger: {entity: effect, token}}) {
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let targetToken = token.scene.tokens.get(effect.flags['chris-premades']?.damageTurnStart?.token);
    if (!targetToken) return;
    let config = itemUtils.getGenericFeatureConfig(originItem, 'damageTurnStart');
    let damageRoll = config.specificDamage.length ? config.specificDamage : originItem.system.damage.parts.map(i => i[0]).join(' + ');
    let roll = await new Roll(damageRoll, originItem.getRollData()).evaluate();
    await workflowUtils.applyWorkflowDamage(token.actor, roll, null, [targetToken], {flavor: originItem.name, sourceItem: originItem});
}
export let damageTurnStart = {
    name: 'Damage on Turn Start',
    translation: 'CHRISPREMADES.Macros.DamageTurnStart.Name',
    version: '0.12.78',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'specificDamage',
            label: 'CHRISPREMADES.Macros.DamageTurnStart.SpecificDamage',
            type: 'text',
            default: ''
        }
    ]
};