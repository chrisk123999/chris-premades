import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['downButNotOutEffect']);
    genericUtils.setProperty(effectData, 'flags.chris-premades.downButNotOut.validateWeaponType', itemUtils.getConfig(workflow.item, 'validateWeaponType'));
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'downButNotOutEffect', rules: downButNotOutEffect.rules});
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = effect.flags['chris-premades']?.downButNotOut.validateWeaponType;
    if (validateWeaponType && !['simpleM', 'improv'].includes(workflow.item.system.type.value)) return;
    let con = workflow.actor.system.abilities.con.mod;
    let digging = effectUtils.getEffectByIdentifier(workflow.actor, 'diggingDeep');
    let damageType = workflow.damageRolls[0]?.options.type ?? workflow.defaultDamageType;
    let exhaustion = digging?.flags['chris-premades']?.exhaustion ?? workflow.actor.system.attributes.exhaustion ?? 0;
    await workflowUtils.bonusDamage(workflow, `${con} + ${exhaustion}`, {damageType});
}
export let downButNotOut = {
    name: 'Down But Not Out',
    version: '1.4.29',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },   
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
export let downButNotOutEffect = {
    name: 'Down But Not Out Effect',
    version: downButNotOut.version,
    rules: downButNotOut.rules,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};