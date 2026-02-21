import {activityUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let validateWeaponType = itemUtils.getConfig(item, 'validateWeaponType');
    if (validateWeaponType && !['simpleM', 'improv'].includes(workflow.item.system.type.value)) return;
    if (!workflow.hitTargets.size) return;
    if (!combatUtils.perTurnCheck(item, 'schoolOfHardKnocks')) return;
    let selection = await dialogUtils.selectDocumentDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), item.system.activities.contents);
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'schoolOfHardKnocks');
    let id = activityUtils.getIdentifier(selection);
    if (id === 'damage') {
        let formula = selection.damage.parts[0].formula;
        let damageType = workflow.damageRolls[0]?.options.type ?? workflow.defaultDamageType;
        let activityData = selection.toObject();
        activityData.damage = {};
        await workflowUtils.bonusDamage(workflow, formula, {ignoreCrit: true, damageType});
        await workflowUtils.syntheticActivityDataRoll(activityData, item, item.parent, []);
    } else {
        await workflowUtils.syntheticActivityRoll(selection, workflow.hitTargets, {options: {originWorkflow: workflow.id}});
    }
}
async function combatEnd({trigger: {entity: item}}) {
    await combatUtils.setTurnCheck(item, 'schoolOfHardKnocks', true);
}
async function applyEffect({trigger: {token: self}, workflow}) {
    let target = workflow.targets.first()?.actor;
    if (!target) return;
    let id = activityUtils.getIdentifier(workflow.activity);
    let effectData = {
        name: `${workflow.item.name}: ${workflow.activity.name}`,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                showIcon: true,
                stackable: 'noneName'
            }
        }
    };
    switch (id) {
        case 'endanger': 
            effectUtils.addMacro(effectData, 'midi.actor', ['schoolOfHardKnocksEndanger']);
            genericUtils.setProperty(effectData, 'flags.chris-premades.originWorkflow', workflow.workflowOptions.originWorkflow);
            break;
        case 'provoke':
            effectData.changes = [{
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                value: `!workflow.targets.some(t => t.id === '${self.id}')`,
                priority: 20
            }];
            genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['turnEndSource']);
            break;
        default: 
            return;
    }
    await effectUtils.createEffect(target, effectData, {identifier: 'schoolOfHardKnocksEndanger', rules: schoolOfHardKnocksEndanger.rules});
}
async function endangerDamage({trigger: {entity: effect}, workflow}) {
    if (effect.flags['chris-premades']?.originWorkflow === workflow.id) return;
    if (!workflow.hitTargets.size) return;
    let newRolls = workflow.damageRolls.map(async d => {
        let max = d.terms.reduce((total, term) => 
            term.isDeterministic ? 
                total + term.formula : 
                total + (term.number * term.faces),
        '');
        return await rollUtils.damageRoll(max, workflow.actor, d.options); 
    });
    await workflow.setDamageRolls(newRolls);
    await genericUtils.remove(effect);
}
export let schoolOfHardKnocks = {
    name: 'School of Hard Knocks',
    version: '1.4.29',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'rollFinished',
                macro: applyEffect,
                priority: 50,
                activities: ['endanger', 'provoke']
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
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
export let schoolOfHardKnocksEndanger = {
    name: 'School of Hard Knocks: Endanger',
    version: schoolOfHardKnocks.version,
    rules: schoolOfHardKnocks.rules,
    midi: {
        actor: [
            {
                pass: 'targetDamageRollComplete',
                macro: endangerDamage,
                priority: 250
            }
        ]
    }
};
