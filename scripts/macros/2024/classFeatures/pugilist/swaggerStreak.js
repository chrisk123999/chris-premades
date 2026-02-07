import {dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
import {fisticuffs} from './fisticuffs.js';

async function checkSkill({trigger: {entity: item, roll, actor, options, checkId, skillId}}) {
    if (!item.system.uses.value) return;
    let ability = skillId ? roll.data.abilityId : checkId;
    if (!['str', 'dex', 'con', 'cha'].some(a => ability === a)) return;
    let targetValue = roll.options.target;
    if (targetValue && roll.total >= targetValue) return;
    let moxie = itemUtils.getItemByIdentifier(actor, 'moxie');
    if (!moxie?.system.uses.value) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier') ?? 'pugilist';
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier') ?? 'fisticuffs';
    let scale = actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (' + scale.formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item, []);
    genericUtils.setProperty(options, 'chris-premades.swagger', true);
    return await rollUtils.addToRoll(roll, scale.formula);
}
async function checkSkillLate({trigger: {entity: item, roll, actor, options}}) {
    if (!options?.['chris-premades']?.swagger) return;
    let targetValue = roll.options.target;
    let success = false;
    if (targetValue) {
        success = roll.total >= targetValue;
    } else {
        success = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.PeerlessSkill.Confirm', {buttons: 'yesNo'});
    }
    if (success) return;
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    let moxie = itemUtils.getItemByIdentifier(actor, 'moxie');
    if (!moxie) return;
    await genericUtils.update(moxie, {'system.uses.spent': moxie.system.uses.spent - 1});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['swagger'], 'moxie');
    await itemUtils.fixScales(item);
}
export let swaggerStreak = {
    name: 'Swagger Streak',
    version: '1.4.25',
    rules: 'modern',
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
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'pugilist',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'fisticuffs',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: fisticuffs.scales
};
