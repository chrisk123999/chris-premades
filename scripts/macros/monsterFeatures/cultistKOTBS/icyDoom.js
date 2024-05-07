import {chris} from '../../../helperFunctions.js';
import {rimesBindingIce} from '../../spells/rimesBindingIce.js';
async function dead(token, effect) {
    let icyDoom = chris.findEffect(token.actor, 'Icy Doom');
    if (icyDoom) return;
    await effect.parent.use();
}
async function start(token) {
    if (chris.jb2aCheck() != 'patreon') return;
    await rimesBindingIce.freeze(token, 'icyDoom');
}
async function end(token) {
    if (chris.jb2aCheck() != 'patreon') return;
    await rimesBindingIce.unFreeze(token, 'icyDoom');
}
export let icyDoom = {
    'start': start,
    'end': end,
    'dead': dead
};