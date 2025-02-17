import {activityUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function veryEarly({activity, dialog, actor, config}) {
    if (activity.item.system.uses.value) return;
    dialog.configure = false;
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration?.system?.uses?.value) return true;
    let selection = await dialogUtils.confirm(activity.item.name, genericUtils.format('CHRISPREMADES.Generic.ConsumeItemToUse', {item: bardicInspiration.name}));
    if (!selection) return true;
    genericUtils.setProperty(config, 'consume.resources', false);
    await genericUtils.update(bardicInspiration, {'system.uses.spent': bardicInspiration.system.uses.spent + 1});
}
async function spell({trigger: {entity: item}, workflow}) {
    if (!workflow.item || !workflow.token) return;
    if (workflow.item.type != 'spell' || activityUtils.isSpellActivity(workflow.activity)) return;
    let validModes = ['always', 'pact', 'prepared'];
    if (!validModes.includes(workflow.item.system.preparation.mode)) return;
    let spellSchools = itemUtils.getConfig(item, 'spellSchools');
    if (!spellSchools.length) return;
    if (!spellSchools.includes(workflow.item.system.school)) return;
    if (!item.system.uses.value) {
        let bardicInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'bardicInspiration');
        if (!bardicInspiration?.system?.uses?.value) return;
    }
    let range = itemUtils.getConfig(item, 'range');
    let nearbyTokens = tokenUtils.findNearby(workflow.token, range, 'enemy', {includeIncapacitated: true});
    if (!nearbyTokens.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Generic.UseItem', {item: item.name}), nearbyTokens, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [selection[0]]);
}
export let beguilingMagic = {
    name: 'Beguiling Magic',
    version: '1.1.39',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'rollFinished',
                macro: spell,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'spellSchools',
            label: 'CHRISPREMADES.Config.SpellSchools',
            type: 'select-many',
            default: ['enc', 'ill'],
            options: constants.spellSchoolOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 60,
            category: 'homebrew',
            homebrew: true
        }
    ]
};