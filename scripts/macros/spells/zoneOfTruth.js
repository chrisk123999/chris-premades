import {activityUtils, combatUtils, effectUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';
async function save(token, template) {
    let originItem = await fromUuid(template.flags['chris-premades'].zoneOfTruth.origin);
    if (!originItem) return;
    let feature = activityUtils.getActivityByIdentifier(originItem, 'zoneOfTruthSave', {strict: true});
    if (!feature) return;
    let workflow = await workflowUtils.syntheticActivityRoll(feature, [token]);
    if (!workflow.failedSaves.size) return;
    let startTime = template.flags['chris-premades'].zoneOfTruth.startTime;
    let worldTime = game.time.worldTime;
    let duration = template.flags['chris-premades'].zoneOfTruth.duration;
    let remaining = startTime - worldTime + duration;
    let effectData = {
        name: templateUtils.getName(template),
        img: workflow.item.img,
        origin: originItem.uuid,
        duration: {
            seconds: remaining
        }
    };
    await effectUtils.createEffect(token.actor, effectData, {parentEntity: template, identifier: 'zoneOfTruthSave'});
}
async function enterOrStart({trigger: {token, entity: template}}) {
    if (!token.actor) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'zoneOfTruthSave');
    if (effect) return;
    if (combatUtils.inCombat()) {
        let touchedTokens = template.flags['chris-premades']?.zoneOfTruth?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        if (touchedTokens.includes(token.id)) return;
        touchedTokens.push(token.id);
        await genericUtils.setFlag(template, 'chris-premades', 'zoneOfTruth.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    await save(token, template);
}
async function use({trigger, workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    if (!workflow.template) return;
    await genericUtils.update(workflow.template, {
        flags: {
            'chris-premades': {
                castData: {
                    castLevel: workflow.castData.castLevel,
                    baseLevel: workflow.castData.baseLevel,
                    saveDC: itemUtils.getSaveDC(workflow.item)
                },
                template: {
                    name: workflow.item.name
                },
                macros: {
                    template: ['zoneOfTruth']
                },
                zoneOfTruth: {
                    origin: workflow.item.uuid,
                    startTime: game.time.worldTime,
                    duration: itemUtils.convertDuration(workflow.item)
                }
            }
        }
    });
}
export let zoneOfTruth = {
    name: 'Zone of Truth',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    template: [
        {
            pass: 'enter',
            macro: enterOrStart,
            priority: 50
        },
        {
            pass: 'stay',
            macro: enterOrStart,
            priority: 50
        },
        {
            pass: 'turnStart',
            macro: enterOrStart,
            priority: 50
        }
    ]
};