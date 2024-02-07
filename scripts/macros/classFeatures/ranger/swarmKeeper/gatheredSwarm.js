import {chris} from '../../../../helperFunctions.js';
let states = {};
async function loop(token) {
    while (states[token.id].state != 'stopped') {
        let effect = 'jb2a.' + states[token.id].animation + '.loop.01.' + states[token.id].color;
        switch (states[token.id].state) {
            case 'ready':
                await new Sequence()
                    .effect()
                        .atLocation(token)
                        .file(effect)
                        .attachTo(token)
                        .scaleToObject(2)
                        .name('swarm-' + token.id)
                        .fadeIn(100)
                        .fadeOut(100)
                        .waitUntilFinished(-100)
                    .play();
                break;
            case 'attack':
                await new Sequence()
                    .effect()
                        .atLocation(token)
                        .file(effect)
                        .scaleToObject(2)
                        .scaleOut(1.5, 500, {'delay': -500})
                        .fadeIn(100)
                        .fadeOut(100)
                        .moveTowards(states[token.id].target, {'ease': 'easeInOutSine'})
                        .waitUntilFinished(-100)
                    .effect()
                        .atLocation(states[token.id].target)
                        .file('jb2a.' + states[token.id].animation + '.inward.01.' + states[token.id].color)
                        .scaleToObject(2)
                    .effect()
                        .atLocation(states[token.id].target)
                        .file(effect)
                        .scaleToObject(4)
                        .fadeIn(100)
                        .fadeOut(100)
                        .duration(3000)
                        .waitUntilFinished(-100)
                    .effect()
                        .atLocation(states[token.id].target)
                        .file(effect)
                        .scaleToObject(4)
                        .scaleOut(0.375, 500, {'delay': -2000})
                        .fadeIn(100)
                        .fadeOut(100)
                        .moveTowards(token, {'ease': 'easeInOutSine'})
                        .waitUntilFinished(-100)
                    .play();
                states[token.id].state = 'ready';
                break;
        }
    }
}
function start(token, animation, color) {
    setProperty(states, token.id, {'animation': animation, 'color': color, 'state': 'ready', 'target': null});
    loop(token);
}
function stop(token) {
    setProperty(states, token.id, {'animation': states[token.id]?.animation, 'color': states[token.id]?.color, 'state': 'stopped', 'target': null});
}
function attack(token, target) {
    setProperty(states, token.id, {'animation': states[token.id]?.animation, 'color': states[token.id]?.color, 'state': 'attack', 'target': target});
}
let stateMachine = {
    'start': start,
    'stop': stop,
    'attack': attack,
    'loop': loop
}
export let gatheredSwarm = {
    'animation': {
        'stateMachine': stateMachine
    }
}