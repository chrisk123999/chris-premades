import {DialogApp} from '../../../../applications/dialog.js';
import {constants, activityUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function hit({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let unarmedStrikeItem = workflow.item;
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(unarmedStrikeItem))) return;
    let targetToken = workflow.targets.first();
    let grapple = activityUtils.getActivityByIdentifier(unarmedStrikeItem, 'grapple', {strict: true});
    let shovePush = activityUtils.getActivityByIdentifier(unarmedStrikeItem, 'shovePush', {strict: true});
    let shoveProne = activityUtils.getActivityByIdentifier(unarmedStrikeItem, 'shoveProne', {strict: true});
    if (!grapple || !shovePush || !shoveProne) return;
    let groundwork = itemUtils.getItemByIdentifier(workflow.actor, 'groundwork');
    let selection;
    if (groundwork) {
        await doStopandDrop(); 
    } else {
        selection = await dialogUtils.selectDocumentDialog(unarmedStrikeItem.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName:item.name, tokenName: targetToken.name}), [grapple, shoveProne, shovePush], {sortAlphabetical: true, displayReference: true});
    } 
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(selection, [targetToken]);

    async function doStopandDrop() {
        let itemName = activityUtils.getActivityByIdentifier(groundwork, 'stopAndDrop', {strict: true})?.name ?? 'Stop and Drop';
        let inputs = [
            [
                'checkbox',
                [{
                    label: genericUtils.format('CHRISPREMADES.Macros.Grappler.Grapple', {tokenName: targetToken.name}),
                    name: 'grapple',
                    options: {isChecked: true}
                }],
                {displayAsRows: true}
            ],
            [
                'radio',
                [{
                    label: shovePush.name,
                    name: 'shovePush',
                    options: {image: shovePush.img}
                },
                {
                    label: shoveProne.name,
                    name: 'shoveProne',
                    options: {image: shoveProne.img}
                },
                {
                    label: genericUtils.translate('No') + ' ' + genericUtils.translate('CHRISPREMADES.Macros.Shove.Shove'),
                    name: 'none',
                    options: {image: 'icons/svg/cancel.svg', isChecked: true}
                }],
                {radioName: 'shove', displayAsRows: true}
            ]
        ];
        let result = await DialogApp.dialog(unarmedStrikeItem.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName, tokenName: targetToken.name}), inputs, 'okCancel');
        if (!result || !result.buttons) selection = false;
        else {
            if (result.grapple) await workflowUtils.syntheticActivityRoll(grapple, [targetToken]);
            switch (result.shove) {
                case 'shovePush': selection = shovePush; break;
                case 'shoveProne': selection = shoveProne; break;
                default: selection = false;
            }
        }
    }
}
export let heavyHitter = {
    name: 'Heavy Hitter',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: hit,
                priority: 50
            }
        ]
    }
};
