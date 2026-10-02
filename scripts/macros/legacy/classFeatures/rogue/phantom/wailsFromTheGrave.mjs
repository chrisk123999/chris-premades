import {actorUtils, automationUtils, combatUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function used({actor, data: {workflow, targetToken}}) {
    const item = actorUtils.getItemByIdentifier(actor, 'wails-from-the-grave');
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'damage') : undefined;
    if (!activity || !combatUtils.isOwnTurn(workflow.token)) return;
    const tokensOfTheDeparted = actorUtils.getItemByIdentifier(actor, 'tokens-of-the-departed');
    const tokenActivity = tokensOfTheDeparted?.system.uses.value ? itemUtils.getActivityByIdentifier(tokensOfTheDeparted, 'use-wail') : undefined;
    if (!item.system.uses.value && !tokenActivity) return;
    const candidates = tokenUtils.findNearby(targetToken, 30, {disposition: 'ally'}).filter(token => tokenUtils.canSee(workflow.token.document, token));
    if (!candidates.length) return;
    const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.WailsFromTheGrave.Select', {item: item.name}), candidates, {type: 'one'});
    if (!selection?.result) return;
    let spendToken = false;
    if (tokenActivity) {
        const hasUses = item.system.uses.value;
        const format = {name: tokensOfTheDeparted.name, feature: item.name};
        spendToken = await dialogUtils.confirm(tokensOfTheDeparted.name, _loc('CHRISPREMADES.Macros.Legacy.WailsFromTheGrave.' + (hasUses ? 'Spend' : 'MustSpend'), format), hasUses ? {} : {buttons: 'okCancel'});
        if (!spendToken && !hasUses) return;
    }
    const extra = await automationUtils.calledEvent('wailsFromTheGraveTargets', actor, {multiResult: true, canOverlap: true, data: {workflow, targetToken}});
    if (spendToken) await workflowUtils.syntheticActivityRoll(tokenActivity, []);
    await workflowUtils.syntheticActivityRoll(activity, [selection.result, ...extra], {consumeUsage: !spendToken, consumeResources: !spendToken});
}
export const wailsFromTheGrave = {
    name: 'Wails from the Grave',
    version: '2.0.0',
    rules: '2014',
    called: [
        {
            pass: 'actorSneakAttackUsed',
            macro: used,
            priority: 50
        }
    ],
    config: {
        subclassIdentifier: {
            default: 'phantom',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'behavior'
        }
    },
    notes: 'Fires the "wailsFromTheGraveTargets" called event (multiResult, canOverlap) after the selected target is chosen.\n\tData available: workflow, targetToken.\n\tReturn an additional target TokenDocument to add it to the wail.',
    scales: [
        {
            identifier: 'wails-from-the-grave',
            classIdentifier: 'phantom',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'wails-from-the-grave',
                    type: 'dice',
                    scale: {
                        1: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        3: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        7: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        9: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        11: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        13: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        15: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        17: {
                            number: 5,
                            faces: 6,
                            modifiers: []
                        },
                        19: {
                            number: 5,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Wails from the Grave',
                icon: null
            }
        }
    ]
};
