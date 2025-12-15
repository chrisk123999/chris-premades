import {dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function check({trigger: {entity: item, roll, actor, options}}) {
    let targetValue = roll.options.target;
    if (targetValue) {
        if (roll.total >= targetValue) return;
    }
    let secondWind = itemUtils.getItemByIdentifier(actor, 'secondWind');
    if (!secondWind?.system?.uses?.value) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classLevels = actor.classes[classIdentifier]?.system?.levels;
    if (!classLevels) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (1d10 + ' + classLevels + ')', rollTotal: roll.total}));
    if (!selection) return;
    let workflow = await workflowUtils.syntheticItemRoll(item, []);
    genericUtils.setProperty(options, 'chris-premades.tacticalMind', true);
    return await rollUtils.addToRoll(roll, String(workflow.utilityRolls[0].total));
}
async function checkLate({trigger: {entity: item, roll, actor, options}}) {
    if (!options?.['chris-premades']?.tacticalMind) return;
    let targetValue = roll.options.target;
    if (targetValue) {
        if (roll.total < targetValue) return;
    } else {
        let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.PeerlessSkill.Confirm', {buttons: 'yesNo'});
        if (!selection) return;
    }
    let secondWind = itemUtils.getItemByIdentifier(actor, 'secondWind');
    if (!secondWind) return;
    await genericUtils.update(secondWind, {'system.uses.spent': secondWind.system.uses.spent + 1});
}
export let tacticalMind = {
    name: 'Tactical Mind',
    version: '1.3.164',
    rules: 'modern',
    skill: [
        {
            pass: 'bonus',
            macro: check,
            priority: 50
        },
        {
            pass: 'post',
            macro: checkLate,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: check,
            priority: 50
        },
        {
            pass: 'post',
            macro: checkLate,
            priority: 50
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'fighter',
            category: 'homebrew',
            homebrew: true
        }
    ]
};