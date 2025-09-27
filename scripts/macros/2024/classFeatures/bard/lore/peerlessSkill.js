import {constants, dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function attackEarly({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || workflow.isFumble || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let bardicInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'bardicInspiration');
    if (!bardicInspiration?.system?.uses?.value) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier') ?? 'inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: item.name + ' (' + scale.formula + ')', attackTotal: workflow.attackTotal}));
    if (!selection) return;
    await workflowUtils.bonusAttack(workflow, scale.formula);
    genericUtils.setProperty(workflow, 'chris-premades.peerlessSkill', true);
    await workflowUtils.syntheticItemRoll(item, []);
}
async function attackLate({trigger, workflow}) {
    if (!workflow?.['chris-premades']?.peerlessSkill || !workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    let bardicInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    await genericUtils.update(bardicInspiration, {'system.uses.spent': bardicInspiration.system.uses.spent + 1});
}
async function checkSkill({trigger: {entity: item, roll, actor, options}}) {
    let targetValue = roll.options.target;
    if (targetValue) {
        if (roll.total >= targetValue) return;
    }
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration?.system?.uses?.value) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier') ?? 'inspiration';
    let scale = actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (' + scale.formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, []);
    genericUtils.setProperty(options, 'chris-premades.peerlessSkill', true);
    return await rollUtils.addToRoll(roll, scale.formula);
}
async function checkSkillLate({trigger: {entity: item, config, roll, actor, options}}) {
    if (!options?.['chris-premades']?.peerlessSkill) return;
    let targetValue = roll.options.target;
    if (targetValue) {
        if (roll.total < targetValue) return;
    } else {
        let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.PeerlessSkill.Confirm', {buttons: 'yesNo'});
        if (!selection) return;
    }
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    await genericUtils.update(bardicInspiration, {'system.uses.spent': bardicInspiration.system.uses.spent + 1});
}
async function added({trigger: {entity: item}}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[classIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[classIdentifier]?.['inspiration']) {
        await itemUtils.setConfig(item, 'classIdentifier', 'inspiration');
        return;
    }
    await itemUtils.fixScales(item);
}
export let peerlessSkill = {
    name: 'Peerless Skill',
    version: '1.3.57',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attackEarly,
                priority: 200
            },
            {
                pass: 'rollFinished',
                macro: attackLate,
                priority: 25
            }
        ]
    },
    skill: [
        {
            pass: 'bonus',
            macro: checkSkill,
            priority: 50
        },
        {
            pass: 'post',
            macro: checkSkillLate,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: checkSkill,
            priority: 50
        },
        {
            pass: 'post',
            macro: checkSkillLate,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: bardicInspiration.scales
};