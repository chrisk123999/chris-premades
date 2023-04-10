import {chris} from '../../../helperFunctions.js';
async function passive({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0 || !this.damageList) return;
    let maxHP = null;
    let killedTarget = false;
    for (let i of this.damageList) {
        if (i.newHP === 0) {
            killedTarget = true;
            let targetToken = await fromUuid(i.tokenUuid);
            let targetMaxHP = targetToken.actor.system.attributes.hp.max;
            if (targetMaxHP > maxHP) maxHP = targetMaxHP;
        }
    }
    if (!killedTarget) return;
    let effect = chris.findEffect(this.actor, 'Soul Thirst - Passive');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    await originItem.use();
    await chris.applyDamage([this.token], Math.floor(maxHP / 2), 'temphp');
}
async function onHit(workflow, targetToken) {
    if (workflow.hitTargets.size === 0) return;
    if (targetToken.actor.system.attributes.hp.temp > 0) return;
    let effect = chris.findEffect(targetToken.actor, 'Soul Thirst');
    if (effect) await chris.removeEffect(effect);
}
export let soulThirst = {
    'passive': passive,
    'onHit': onHit
}