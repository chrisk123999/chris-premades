import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function item({speaker, actor, token, character, item, args}) {
    let spellName = this.actor.flags['chris-premades']?.feature?.graspOfHadar?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (this.item.name != spellName || this.hitTargets.size != 1) return;
    let targetToken = this.targets.first();
    let distance = chris.getDistance(this.token, targetToken);
    if (distance <= 5) return;
    let effect = chris.findEffect(this.actor, 'Eldritch Invocations: Grasp of Hadar');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (!chris.perTurnCheck(originItem, 'feature', 'graspOfHadar', true, this.token.id)) return;
    let queueSetup = await queue.setup(this.item.uuid, 'graspOfHadar', 451);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Grasp of Hadar?', [['Yes', -10], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feature.graspOfHadar.turn', game.combat.round + '-' + game.combat.turn);
    if (distance <= 10) selection = -5;
    let knockBackFactor;
    let ray;
    let newCenter;
    let hitsWall = true;
    while (hitsWall) {
        knockBackFactor = selection / canvas.dimensions.distance;
        ray = new Ray(this.token.center, targetToken.center);
        newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
        hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
        if (hitsWall) {
            selection -= 5;
            if (selection === 0) {
                ui.notifications.info('Target is unable to be moved!');
                queue.remove(this.item.uuid);
                return;
            }
        }
    }
    newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
    let targetUpdate = {
        'token': {
            'x': newCenter.x,
            'y': newCenter.y
        }
    };
    let options = {
        'permanent': true,
        'name': this.item.name,
        'description': this.item.name
    };
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    await originItem.use();
    queue.remove(this.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.graspOfHadar.turn', '');
}
export let graspOfHadar = {
    'item': item,
    'combatEnd': combatEnd
}