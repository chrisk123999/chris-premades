import {actorUtils, animationUtils, automationUtils, dialogUtils, documentUtils, genericUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function bonusAttacks({document: activity, data}) {
    if (documentUtils.getIdentifier(data.macroActivity) !== 'flurry-of-blows') return;
    return automationUtils.getConfigValue(activity.item, 'attacks');
}
async function focusPointExtras({document: activity, token, workflow}) {
    const id = documentUtils.getIdentifier(workflow.activity);
    if (id === 'step-of-the-wind-dash' && documentUtils.getRules(workflow.item) === '2024') return;
    if (['patient-defense', 'patient-defense-disengage-dodge'].includes(id)) return await workflowUtils.syntheticActivityRoll(activity, [token]);
    if (!['step-of-the-wind-dash', 'step-of-the-wind-disengage', 'step-of-the-wind-dash-disengage'].includes(id)) return;
    const nearby = tokenUtils.findNearby(token, 5, {disposition: 'ally'}).filter(t => actorUtils.getSize(t.actor) <= 3);
    if (!nearby.length) return;
    const prompt = 'CHRISPREMADES.Macros.Modern.HeightenedFocus.' + (animationUtils.jb2aCheck() !== 'patreon' ? 'PromptNoAnimation' : 'Prompt');
    const selection = await dialogUtils.selectTargetDialog(activity.item.name, prompt, nearby, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    if (!selection?.result) return;
    workflowUtils.setWorkflowProperty(workflow, 'heightenedFocusCarry', selection.result);
}
async function carryAlly({token, workflow}) {
    // users without the movement animation will have to manually move their token while the selectTargetDialog is open
    await genericUtils.sleep(200);
    const ally = workflowUtils.getWorkflowProperty(workflow, 'heightenedFocusCarry');
    if (ally) await tokenUtils.displaceToken(ally, {centerpoint: token.object.center, sourceToken: token, range: 5});
}
export const heightenedFocus = {
    name: 'Heightened Focus',
    version: '2.0.4',
    rules: '2024',
    called: [
        {
            pass: 'actorExtraAttack',
            macro: bonusAttacks,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'actorRollFinished',
            macro: focusPointExtras,
            priority: 10 // before movementAnimation
        },
        {
            pass: 'actorRollFinished',
            macro: carryAlly,
            priority: 200
        }
    ],
    config: {
        attacks: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Config.Attacks',
            category: 'behavior'
        }
    }
};
