import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || !this.damageList) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let targetRace = chris.raceOrType(targetActor);
    if (chris.raceOrType(targetActor) != 'undead') {
        if (targetRace === 'construct') return;
        let doHealing = false;
        for (let i of this.damageList) {
            if (i.oldHP != 0 && i.newHP === 0) {
                doHealing = true;
                break;
            }
        }
        if (!doHealing) return;
        let maxHP = targetActor.system.attributes.hp.max;
        let currentTempHP = this.actor.system.attributes.hp.temp;
        if (currentTempHP <= maxHP) await chris.applyDamage([this.token], maxHP, 'temphp');
        let effect = chris.findEffect(this.actor, 'Devoured Soul');
        if (effect) return;
        let effectData = {
            'label': 'Devoured Soul',
            'icon': this.item.img,
            'origin': this.item.uuid,
            'duration': {
                'seconds': 86400
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.advantage.attack.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.save.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.check.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.chris-premades.feature.onHit',
                    'mode': 5,
                    'value': 'blackrazor',
                    'priority': 20
                }
            ],
            'transfer': true
        };
        await chris.createEffect(this.actor, effectData);
    } else {
        let damageRoll = await new Roll('1d10[necrotic]').roll({async: true});
        let healingRoll = await new Roll('1d10[healing]').roll({async: true});
        await chris.applyWorkflowDamage(this.token, damageRoll, 'necrotic', [this.token], this.item.name, this.itemCardId);
        await chris.applyWorkflowDamage(targetToken, healingRoll, 'healing', [targetToken], this.item.name, this.itemCardId);
        return;
    }
}
async function onHit(workflow, targetToken) {
    if (targetToken.actor.system.attributes.hp.temp != 0) return;
    let effect = chris.findEffect(targetToken.actor, 'Devoured Soul');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let blackrazor = {
    'item': item,
    'onHit': onHit
}