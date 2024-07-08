import {actorUtils, genericUtils, socketUtils, tokenUtils} from '../utils.js';
let sizes = {
    grg: 4,
    huge: 3,
    lg: 2,
    med: 1,
    sm: 1,
    tiny: 1
};
let scales = {
    grg: 1,
    huge: 1,
    lg: 1,
    med: 1,
    sm: 0.8,
    tiny: 0.5
};
async function updateTokenSize(actor, animate, old) {
    let size = actor.system.traits.size;
    let sizeDiff = sizes[size] - sizes[old];
    let scaleDiff = scales[size] - scales[old];
    if (!sizeDiff && !scaleDiff) return;
    let updates = {
        width: sizes[size],
        height: sizes[size],
        texture: {
            scaleX: scales[size],
            scaleY: scales[size]
        }
    };
    await genericUtils.update(actor, {'prototypeToken': updates});
    let tokens = actorUtils.getTokens(actor);
    if (!tokens.length) return;
    let scene = tokens[0].document.parent;
    let pixels = scene.grid.size * sizeDiff;
    let allUpdates = tokens.map(i => {
        let update = genericUtils.duplicate(updates);
        update._id = i.document.id;
        if (sizeDiff > 0) {
            let room = tokenUtils.checkForRoom(i, sizeDiff);
            let roomCenter = tokenUtils.checkForRoom(i, sizeDiff - 1);
            let direction;
            if (roomCenter.n && roomCenter.e && roomCenter.s && roomCenter.w && sizeDiff % 2 == 0)  {
                direction = 'center';
            } else {
                direction = tokenUtils.findDirection(room);
            }
            switch (direction) {
                case 'ne': update.y = i.document.y - pixels; break;
                case 'sw': update.x = i.document.x - pixels; break;
                case 'nw': update.x = i.document.x - pixels; update.y = i.document.y - pixels; break;
                case 'center': update.x = i.document.x - (scene.grid.size * (sizeDiff / 2)); update.y = i.document.y - (scene.grid.size * (sizeDiff / 2)); break; 
            }
        } else if (sizeDiff < 0) {
            if (sizeDiff % 2 == 0) {
                update.x = i.document.x - (scene.grid.size * (sizeDiff / 2));
                update.y = i.document.y - (scene.grid.size * (sizeDiff / 2));
            }
        }
        return update;
    });
    await genericUtils.updateEmbeddedDocuments(scene, 'Token', allUpdates, {animate: animate, 'chris-premades': {movement: {ignore: true}}});
}
async function createDeleteUpdateActiveEffect(...args) {
    let effect, updates, options, userId;
    if (args.length === 3) {
        [effect, options, userId] = args;
    } else {
        [effect, updates, options, userId] = args;
    }
    if (!socketUtils.isTheGM()) return;
    let change = effect.changes.find(i => i.key === 'system.traits.size');
    if (!change) return;
    if (effect.target.constructor.name != 'Actor5e') return;
    let animate = effect.flags?.['chris-premades']?.effect?.sizeAnimation ?? true;
    let old = genericUtils.getProperty(options, 'chris-premades.effect.size.old');
    if (!old) return;
    await updateTokenSize(effect.target, animate, old);
}
async function preCreateUpdateActiveEffect(effect, updates, options, userId) {
    if (!socketUtils.isTheGM()) return;
    let change = (updates.changes ?? effect.changes).find(i => i.key === 'system.traits.size');
    if (!change) return;
    if (effect.target.constructor.name != 'Actor5e') return;
    genericUtils.setProperty(options, 'chris-premades.effect.size.old', effect.target.system.traits.size);
}
async function preDeleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    let change = effect.changes.find(i => i.key === 'system.traits.size');
    if (!change) return;
    if (effect.target.constructor.name != 'Actor5e') return;
    genericUtils.setProperty(options, 'chris-premades.effect.size.old', effect.target.system.traits.size);
}
export let tokens = {
    createDeleteUpdateActiveEffect,
    preCreateUpdateActiveEffect,
    preDeleteActiveEffect
};