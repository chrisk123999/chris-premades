import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function sourceAttack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    let validTypes = new Set(['mwak', 'rwak', 'msak', 'rsak']);
    if (!validTypes.has(workflow.item.system.actionType)) return;
    let effect2 = chris.findEffect(workflow.actor, 'Ancestral Protectors');
    if (!effect2) return;
    let originItem = await fromUuid(effect2.origin);
    let useFeature = chris.perTurnCheck(originItem, 'feature', 'ancestralProtectors', true, workflow.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'ancestralProtectors', 450);
    if (!queueSetup) return;
    let effectData = {
        'label': 'Ancestral Protectors Target',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'rounds': 2
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'CPR-ancestralProtectorsTarget,preAttackRoll',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'CPR-ancestralProtectorsTargetDamage,postDamageRoll',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
    queue.remove(workflow.item.uuid);
}
async function targetAttack(workflow) {
    let effect = chris.findEffect(workflow.actor, 'Ancestral Protectors Target');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = workflow.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'ancestralProtectors', 50);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution['Disadvantage: Ancestral Protectors'] = true;
    queue.remove(workflow.item.uuid);
}
async function targetDamage(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let effect = chris.findEffect(workflow.actor, 'Ancestral Protectors Target');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = workflow.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup =  await queue.setup(workflow.item.uuid, 'ancestralProtectors', 475);
    if (!queueSetup) return;
    let damageFormula = 'floor((' + workflow.damageRoll._formula + ') / 2)';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
export let ancestralProtectors = {
    'sourceAttack': sourceAttack,
    'targetAttack': targetAttack,
    'targetDamage': targetDamage
}