import {summonEffects} from '../../macros/animations/summonEffects';
function jb2aCheck() {
    let patreon = game.modules.get('jb2a_patreon')?.active;
    let free = game.modules.get('JB2A_DnD5e')?.active;
    if (patreon && free) {
        ui.notifications.warn('Both JB2A modules are active! Please disable the free version.');
        return 'patreon';
    }
    if (patreon) return 'patreon';
    if (free) return 'free';
    ui.notifications.warn('No JB2A module active! Please install JB2A.');
    return false;
}
function aseCheck() {
    let isActive = game.modules.get('animated-spell-effects-cartoon')?.active;
    return isActive;
}
function simpleAttack(sourceToken, targetToken, animation, {sound, missed}) {
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .file(animation)
            .missed(missed)
        .sound()
            .playIf(sound)
            .file(sound)
        .play();
    /* eslint-enable indent */
}

export let animationUtils = {
    jb2aCheck,
    aseCheck,
    simpleAttack,
    summonEffects
};