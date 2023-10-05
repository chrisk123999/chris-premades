import {chris} from '../../helperFunctions.js';

async function animationStart(token, origin) {
    //Animations by: eskiemoh
    let animation = chris.getConfiguration(origin, 'animation') ?? 'default';
    if (animation === 'none' || !chris.aseCheck()) return;
    new Sequence()
	.effect()
	.file('animated-spell-effects-cartoon.air.puff.03')
	.atLocation(token)
	.scaleToObject(1.75)
	.belowTokens()

	.animation()
	.on(token)
	.opacity(0)

	.effect()
	.from(token)
	.name('Fly')
	.atLocation(token)   
	.opacity(1)
	.duration(800)
	.anchor({'x': 0.5, 'y': 0.7})
	.animateProperty('sprite', 'position.y', {'from': 30, 'to': 0, 'duration': 500})
	.loopProperty('sprite', 'position.y', {'from':0 , 'to':-30, 'duration': 2500, 'pingPong': true, 'delay':500})
	.attachTo(token, {'bindAlpha': false})
	.zIndex(2)
	.persist()

	.effect()
	.from(token)
	.name('Fly')
	.atLocation(token)
	.scaleToObject(0.9)
	.duration(1000)
	.opacity(0.5)
	.belowTokens()
	.filter('ColorMatrix', {'brightness': -1 })
	.filter('Blur', {'blurX': 5, 'blurY': 10 })
	.attachTo(token, {'bindAlpha': false})
	.zIndex(1)
	.persist()

	.play();
}
async function animationEnd(token, origin) {
    let animation = chris.getConfiguration(origin, 'animation') ?? 'default';
    if (animation === 'none' || !chris.aseCheck) return;
    await Sequencer.EffectManager.endEffects({'name': 'Fly', 'object': token });
    new Sequence()
        .animation()
        .on(token)
        .opacity(1)

        .play();
}
export let fly = {
    'animationStart': animationStart,
    'animationEnd': animationEnd
}