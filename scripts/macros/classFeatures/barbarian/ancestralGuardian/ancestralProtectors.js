import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function sourceAttack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let effect = chris.findEffect(this.actor, 'Rage');
    if (!effect) return;
    let validTypes = new Set(['mwak', 'rwak', 'msak', 'rsak']);
    if (!validTypes.has(this.item.system.actionType)) return;
    let effect2 = chris.findEffect(this.actor, 'Ancestral Protectors');
    if (!effect2) return;
    let originItem = await fromUuid(effect2.origin);
    let useFeature = chris.perTurnCheck(originItem, 'feature', 'ancestralProtectors', true, this.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(this.item.uuid, 'ancestralProtectors', 450);
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
                'value': 'function.chrisPremades.macros.ancestralProtectors.targetAttack,preAttackRoll',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.ancestralProtectors.targetDamage,postDamageRoll',
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
    await chris.createEffect(this.targets.first().actor, effectData);
    queue.remove(this.item.uuid);
}
async function targetAttack({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Ancestral Protectors Target');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = this.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup = await queue.setup(this.item.uuid, 'ancestralProtectors', 50);
    if (!queueSetup) return;
    this.disadvantage = true;
    this.attackAdvAttribution['Disadvantage: Ancestral Protectors'] = true;
    queue.remove(this.item.uuid);
}
async function targetDamage({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let effect = chris.findEffect(this.actor, 'Ancestral Protectors Target');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActorUuid = origin.actor.uuid;
    let targetActorUuid = this.targets.first().actor.uuid;
    if (originActorUuid === targetActorUuid) return;
    let queueSetup =  await queue.setup(this.item.uuid, 'ancestralProtectors', 475);
    if (!queueSetup) return;
    let damageFormula = 'floor((' + this.damageRoll._formula + ') / 2)';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
export let ancestralProtectors = {
    'sourceAttack': sourceAttack,
    'targetAttack': targetAttack,
    'targetDamage': targetDamage
}