import {effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: { seconds: 6 }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'haymaker'});
}
async function hit({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = itemUtils.getConfig(item, 'validateWeaponType');
    if (validateWeaponType && !['simpleM', 'improv'].includes(workflow.item.system.type.value)) return;
    let haymaker = effectUtils.getEffectByIdentifier(workflow.actor, 'haymaker');
    if (!haymaker) return;
    if (workflow.hitTargets.size) {
        let moxie = itemUtils.getItemByIdentifier(workflow.actor, 'moxie');
        if (moxie) await genericUtils.update(moxie, {'system.uses.spent': moxie.system.uses.spent - 1});
        let rolls = workflow.damageRolls.map(async d => await rollUtils.damageRoll(d.formula, workflow.actor, d.options, {maximize: true}));
        await workflow.setDamageRolls(rolls);
    }
    await genericUtils.remove(haymaker);
}
async function cleanup({workflow}) {
    let haymakerEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'haymaker');
    if (haymakerEffects.length) await Promise.all(haymakerEffects.map(async e => genericUtils.remove(e)));
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'moxie');
}
export let haymaker = {
    name: 'Haymaker',
    version: '1.4.27',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hit,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: cleanup,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],   
    config: [
        {
            value: 'validateWeaponType',
            label: 'CHRISPREMADES.Macros.MartialArts.ValidateWeaponType',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
