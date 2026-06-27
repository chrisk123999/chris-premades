async function attack(sourceToken, targetToken, attackType) {
    /* eslint-disable indent */
    const hitSeq = new Sequence()
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .fadeIn(100)
            .fadeOut(100)
            .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 75, pingPong: true, gridUnits: true})
            .scaleToObject(targetToken.texture.scaleX)
            .duration(500)
            .opacity(0.15)
            .tint('#fd0706')
        .effect()
            .file('jb2a.particles.outward.red.01.04')
            .atLocation(targetToken)
            .fadeIn(100)
            .fadeOut(400)
            .scaleIn(0, 500, {ease: 'easeOutCubic'}) 
            .scaleToObject(1.65 * targetToken.texture.scaleX)
            .duration(800)
            .opacity(1)
            .randomRotation(true)
            .filter('ColorMatrix', {saturate: 1 })
            .belowTokens(true);
    switch (attackType) {
        case 'slashing':
            new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.water.105')
                    .atLocation(sourceToken)
                    .scale(0.2 * sourceToken.width)
                    .rotateTowards(targetToken)
                    .spriteRotation(80)
                    .spriteOffset({x:-0.15 * sourceToken.width, y: -0.1 * sourceToken.width}, {gridUnits: true})
                    .filter('ColorMatrix', { saturate: 0.75 })
                    .rotateIn(-45, 250, {ease: 'easeOutExpo'})
                    .zIndex(1)
                .effect()
                    .file('jb2a.melee_generic.slashing.one_handed')
                    .atLocation(sourceToken)
                    .scale(0.5 * sourceToken.width)
                    .rotateTowards(targetToken)
                    .mirrorY()
                    .spriteOffset({x:- 1.7 * sourceToken.width}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: -1 })
                    .rotateIn(-90, 250, {ease: 'easeOutBack'})
                    .zIndex(0)
                .thenDo(function(){
                    hitSeq.play();
                })
                .play();
            return;
        case 'bludgeoning':
            new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.water.115')
                    .atLocation(targetToken)
                    .scale(0.17 * sourceToken.width)
                    .rotateTowards(sourceToken)
                    .spriteRotation(0)
                    .spriteOffset({x: -0.45 * sourceToken.width, y: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: 0.75 })
                    .scaleIn(0, 250, {ease: 'easeOutExpo'})
                    .zIndex(1)
                .effect()
                    .file('jb2a.melee_generic.bludgeoning.two_handed')
                    .atLocation(targetToken)
                    .scale(0.4 * sourceToken.width)
                    .rotateTowards(token)
                    .spriteRotation(180)
                    .spriteOffset({x: -1 * sourceToken.width, y:0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: -1 })
                    .scaleIn(0, 250, {ease: 'easeOutExpo'})
                    .zIndex(0)
                .thenDo(function(){
                    hitSeq.play();
                })
                .play();
            return;
        case 'ranged':
            new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.water.109')
                    .atLocation(targetToken)
                    .scale(0.2 * sourceToken.width)
                    .rotateTowards(sourceToken)
                    .spriteRotation(0)
                    .spriteOffset({x: -0.3 * sourceToken.width, y: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: 0.75 })
                    .scaleIn(0, 250, {ease: 'easeOutExpo'})
                    .zIndex(1)
                .effect()
                    .file('animated-spell-effects-cartoon.water.115')
                    .atLocation(targetToken)
                    .scale({x:0.1 * sourceToken.width, y: 0.2 * sourceToken.width})
                    .rotateTowards(sourceToken)
                    .spriteRotation(0)
                    .spriteOffset({x: -0.4 * sourceToken.width, y: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: -1 })
                    .scaleIn(0, 250, {ease: 'easeOutExpo'})
                    .zIndex(0)
                .thenDo(function(){
                    hitSeq.play();
                })
                .play();
            return;
        default:
            new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.water.107')
                    .atLocation(sourceToken)
                    .scale(0.25 * sourceToken.width)
                    .rotateTowards(targetToken)
                    .spriteRotation(18)
                    .spriteOffset({x: -0.6 * sourceToken.width, y: -0.25 * sourceToken.width}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: 0.75 })
                    .rotateIn(-25, 250, {ease: 'easeOutExpo'})
                    .zIndex(1)
                .effect()
                    .file('jb2a.melee_generic.piercing.one_handed')
                    .atLocation(sourceToken)
                    .scale(0.5 * sourceToken.width)
                    .rotateTowards(targetToken)
                    .spriteRotation(15)
                    .mirrorY()
                    .spriteOffset({x: -1.9 * token.document.width, y:-0.3 * sourceToken.width}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: -1 })
                    .rotateIn(-25, 250, {ease: 'easeOutExpo'})
                    .zIndex(0)
                .thenDo(function(){
                    hitSeq.play();
                })
                .play();
            /* eslint-enable indent */
            return;
    }
}
export const sneakAttack = {
    name: 'CHRISPREMADES.Animations.SneakAttack.Name',
    macros: {
        attack
    },
    inputs: ['sourceToken', 'targetToken', 'attackType'],
    requirements: ['jb2a_patreon', 'animated-spell-effects-cartoon'],
    type: 'classFeature',
    credits: [
        {
            name: 'Eskie',
            discord: 'https://discord.gg/RXwkJD4hTe',
            patreon: 'https://www.patreon.com/c/EskieEffects'
        }
    ]
};