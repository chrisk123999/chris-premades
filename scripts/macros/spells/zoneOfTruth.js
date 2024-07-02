import {combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';
async function save(token, template) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Zone of Truth: Save', {getDescription: true, translate: 'CHRISPREMADES.macros.zoneOfTruth.save', identifier: 'zoneOfTruthSave', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.save.dc = templateUtils.getSaveDC(template);
    let originItem = await fromUuid(template.flags['chris-premades'].zoneOfTruth.origin);
    if (!originItem) return;
    let workflow = await workflowUtils.syntheticItemDataRoll(featureData, originItem.actor, [token]);
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
async function enterOrStart({trigger}) {
    if (!trigger.token.actor) return;
    let effect = effectUtils.getEffectByIdentifier(trigger.token.actor, 'zoneOfTruthSave');
    if (effect) return;
    if (combatUtils.inCombat()) {
        let touchedTokens = trigger.entity.flags['chris-premades']?.zoneOfTruth?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        if (touchedTokens.includes(trigger.token.id)) return;
        touchedTokens.push(trigger.token.id);
        await genericUtils.setFlag(trigger.entity, 'chris-premades', 'zoneOfTruth.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    await save(trigger.token, trigger.entity);
}
async function use({trigger, workflow}) {
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
                    duration: workflow.item.system.duration.value * 60
                }
            }
        }
    });
}
export let zoneOfTruth = {
    name: 'Zone of Truth',
    version: '0.12.0',
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