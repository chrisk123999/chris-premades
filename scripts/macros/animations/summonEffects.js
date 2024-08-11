//Animations by: eskiemoh
async function defaultAnimation(location, token, updates, iteration) {
    let image = token.texture.src;
    let imageSize = token.width * token.texture.scaleX;
    new Sequence()
        .wait(200)

        .effect()
        .file('animated-spell-effects-cartoon.magic.mind sliver')
        .atLocation(token, {'offset':{'y': -((imageSize - 1) / 2)}, 'gridUnits': true})
        .scaleToObject(1.1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .animateProperty('spriteContainer', 'position.y', {'from': -3, 'to': -0.3, 'duration': 500, 'ease': 'easeOutCubic', 'gridUnits': true})
        .fadeOut(100)
        .rotate(-90)
        .scaleOut(0, 100, {'ease': 'easeOutCubic'})
        .duration(500)
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)
        .waitUntilFinished(-300)

        .effect()
        .file('animated-spell-effects-cartoon.energy.pulse.yellow')
        .atLocation(token)
        .opacity(1)
        .scaleToObject(1.5)
        .filter('ColorMatrix', {'saturate': -1, 'hue': 160, 'brightness': 2})

        .effect()
        .file('jb2a.particles.outward.blue.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': -0.5, 'brightness': 1.1})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness': 50})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .animation()
        .on(token)
        .fadeIn(500)

        .play();
}
async function celestial(location, token, updates, iteration) {
    let image = token.texture.src;
    let imageSize = token.width * token.texture.scaleX;
    new Sequence()
        .wait(200)

        .effect()
        .file('animated-spell-effects-cartoon.magic.mind sliver')
        .atLocation(token, {'offset': {'y': -((imageSize - 1) / 2)}, 'gridUnits': true})
        .scaleToObject(1.1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness':10})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .animateProperty('spriteContainer', 'position.y', {'from': -3, 'to': -0.3, 'duration': 500, 'ease': 'easeOutCubic', 'gridUnits': true})
        .fadeOut(100)
        .rotate(-90)
        .scaleOut(0, 100, {'ease': 'easeOutCubic'})
        .duration(500)
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)
        .waitUntilFinished(-500)

        .effect()
        .file('jb2a.swirling_feathers.outburst.01.orange.1')
        .atLocation(token)
        .opacity(1)
        .scaleToObject(2)
        .filter('ColorMatrix', {'saturate': 0.25, 'hue': 20, 'brightness': 1.1})
        .belowTokens()
        .zIndex(1)

        .wait(200)

        .effect()
        .file('animated-spell-effects-cartoon.energy.pulse.yellow')
        .atLocation(token)
        .opacity(1)
        .scaleToObject(1.5)

        .effect()
        .delay(250)
        .file('jb2a.markers.light.complete.yellow')
        .attachTo(token)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .belowTokens()
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)
        .zIndex(1.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': -0.5, 'brightness': 1.1})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness': 50})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .animation()
        .on(token)
        .fadeIn(500)

        .play();
}
async function fiend(location, token, updates, iteration) {
    let image = token.texture.src;
    let imageSize = token.width * token.texture.scaleX;
    new Sequence()
        .wait(200)

        .effect()
        .file('animated-spell-effects-cartoon.magic.mind sliver')
        .atLocation(token, {'offset': {'y':-((imageSize - 1) / 2)}, 'gridUnits': true})
        .scaleToObject(1.1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .animateProperty('spriteContainer', 'position.y', {'from': -3, 'to': -0.3, 'duration': 500, 'ease': 'easeOutCubic', 'gridUnits': true})
        .fadeOut(100)
        .rotate(-90)
        .scaleOut(0, 100, {'ease': 'easeOutCubic'})
        .duration(500)
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)
        .waitUntilFinished(-300)

        .effect()
        .file('jb2a.impact.ground_crack.02.dark_red')
        .atLocation(token)
        .opacity(1)
        .randomRotation()
        .belowTokens()
        .scaleToObject(2)
        .zIndex(0.2)

        .wait(100)

        .effect()
        .file('animated-spell-effects-cartoon.energy.pulse.red')
        .atLocation(token)
        .opacity(1)
        .scaleToObject(1.5)

        .effect()
        .file('jb2a.particles.outward.red.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': 1, 'brightness': 0.5})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.red')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.red')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness': 0})
        .filter('Blur', {'blurX': 5, 'blurY': 5 })
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .animation()
        .on(token)
        .fadeIn(250)

        .play();
}
async function fire(location, token, updates, iteration) {
    let image = token.texture.src;
    new Sequence()
        .wait(150)
        
        .effect()
        .file('jb2a.impact.fire.01.orange')
        .atLocation(token, {'offset': {'y': 0}, 'gridUnits': true})
        .scaleToObject(2.5)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)
        
        .wait(100)
        
        .effect()
        .file('jb2a.ground_cracks.orange.02')
        .atLocation(token)
        .fadeIn(500, {'ease': 'easeOutCirc'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        .opacity(1)
        .randomRotation()
        .belowTokens()
        .scaleToObject(1.5)
        .zIndex(0.2)
        
        .effect()
        .file('jb2a.particles.outward.orange.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': 0, 'brightness': 1})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': -0, 'brightness': 1.1})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        
        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 50})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)
        
        .animation()
        .on(token)
        .fadeIn(250)
        
        .play();
}
async function water(location, token, updates, iteration) {
    let image = token.texture.src;
    new Sequence()
        .wait(150)
        
        .effect()
        .file('jb2a.impact.water.02.blue')
        .atLocation(token, {'offset': {'y': 0}, 'gridUnits': true})
        .scaleToObject(2.5)
        .fadeOut(1500, {'ease': 'easeOutExpo'})
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)
        
        .wait(100)
        
        .effect()
        .file('jb2a.water_splash.circle.01.blue')
        .atLocation(token)
        .fadeIn(500, {'ease': 'easeOutCirc'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        .opacity(1)
        .randomRotation()
        .belowTokens()
        .scaleToObject(1.5)
        .zIndex(0.2)
        
        .effect()
        .file('jb2a.particles.outward.blue.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': 1, 'brightness': 1.2})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': -0, 'brightness': 1.1})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        
        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 50})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)
        
        .animation()
        .on(token)
        .fadeIn(250)
        
        .play();
}
async function air(location, token, updates, iteration) {
    let image = token.texture.src;
    new Sequence()
        .wait(150)

        .effect()
        .file('animated-spell-effects-cartoon.air.explosion.gray')
        .atLocation(token, {'offset': {'y': 0}, 'gridUnits': true})
        .scaleToObject(1.5)
        .fadeOut(500, {'ease': 'easeOutExpo'})
        .attachTo(token, {'bindAlpha': false})
        .filter('ColorMatrix', {'saturate': -1, 'hue': -180})
        .zIndex(5)

        .wait(100)

        .effect()
        .file('jb2a.smoke.ring.01.white')
        .atLocation(token)
        .fadeIn(500, {'ease': 'easeOutCirc'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        .playbackRate(1.5)
        .opacity(0.65)
        .randomRotation()
        .belowTokens()
        .scaleToObject(1.5)
        .zIndex(0.2)

        .effect()
        .file('jb2a.particles.outward.blue.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 1.2})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': 0, 'brightness': 1.1})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 50})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .animation()
        .on(token)
        .fadeIn(250)

        .play();
}
async function earth(location, token, updates, iteration) {
    let image = token.texture.src;
    new Sequence()
        .wait(150)

        .effect()
        .file('jb2a.impact.earth.01.browngreen')
        .atLocation(token, {'offset': {'y': 0}, 'gridUnits':true})
        .scaleToObject(2.5)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .attachTo(token, {'bindAlpha': false})
        .zIndex(5)

        .wait(100)

        .effect()
        .delay(100)
        .file('animated-spell-effects-cartoon.smoke.11')
        .atLocation(token)
        .playbackRate(0.65)
        .fadeIn(250)
        .fadeOut(1500)
        .scaleToObject(2)
        .randomRotation()
        .opacity(0.5)
        .filter('ColorMatrix', {'brightness': 0.8})
        .zIndex(4)

        .effect()
        .file('jb2a.particles.outward.orange.01.03')
        .atLocation(token)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': 0.75, 'brightness': 0.85})
        .randomRotation()
        .scaleToObject(2)
        .duration(10000)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {saturate: -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
        .atLocation(token)
        .filter('ColorMatrix', {'saturate': 0.8, 'brightness': 0.85})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness':50})
        .filter('Blur', {'blurX': 5, 'blurY': 5 })
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .animation()
        .on(token)
        .fadeIn(250)

        .play();
}
async function nature(location, token, updates, iteration) {
    new Sequence()
        .wait(200)
        
        .effect()
        .file('jb2a.swirling_leaves.complete.01.green.0')
        .atLocation(token)
        .scaleToObject(2.25)
        .scaleIn(0, 4000, {'ease': 'easeOutBack'})
        .endTime(4500)
        .fadeOut(750, {'ease': 'easeOutQuint'})
        .zIndex(6)
        
        .wait(1000)
        
        .effect()
        .file('jb2a.sacred_flame.target.green')
        .atLocation(token)
        .scaleToObject(2)
        .scaleIn(0, 4000, {'ease': 'easeOutBack'})
        .endTime(2500)
        .fadeOut(500)
        .zIndex(5)
        .waitUntilFinished(-1000)
        
        .effect()
        .file('jb2a.plant_growth.04.ring.4x4.complete.greenwhite')
        .atLocation(token)
        .opacity(1)
        .belowTokens()
        .randomRotation()
        .scaleToObject(1.5)
        .zIndex(1.1)
        
        .wait(200)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.green')
        .atLocation(token)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .duration(1200)
        .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 200})
        .fadeOut(300, {'ease': 'linear'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.1)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.green')
        .atLocation(token)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .scaleToObject(1.25)
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .duration(10000)
        
        .effect()
        .file('jb2a.swirling_leaves.outburst.01.greenorange')
        .atLocation(token)
        .opacity(1)
        .scaleToObject(2)
        .zIndex(1)
        
        .animation()
        .delay(300)
        .on(token)
        .fadeIn(500)
        
        .play();
}
async function shadow(location, token, updates, iteration) {
    let image = token.texture.src;
    new Sequence()
        .wait(150)

        .effect()
        .file('jb2a.smoke.puff.centered.dark_black')
        .atLocation(token)
        .scaleToObject(1.8 * token.texture.scaleX)
        .randomRotation()
        .belowTokens()
        .scaleIn(0, 2000, {'ease': 'easeOutCubic'})
        .repeats(5, 500,500)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(token.texture.scaleX)
        .fadeIn(500, {'ease': 'easeInExpo'})
        .fadeOut(1500, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness': 0})
        .filter('Blur', {'blurX': 5, 'blurY': 5})
        .scaleIn(0, 2000, {'ease': 'easeOutSine'})
        .duration(3500)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-1000)

        .effect()
        .file('jb2a.smoke.puff.centered.dark_black')
        .atLocation(token)
        .scaleToObject(1.8 * token.texture.scaleX)
        .randomRotation()
        .fadeOut(2400)
        .scaleOut(0.25, 2400, {'ease': 'easeOutSine'})

        .animation()
        .on(token)
        .fadeIn(500)

        .play();
}
async function future(location, token, updates, iteration) {
    let image = token.texture.src;
    let imageSize = token.width * token.texture.scaleX;
    new Sequence()
        .wait(150)

        .effect()
        .file('jb2a.token_stage.round.blue.02.02')
        .atLocation(token, {'offset':{'y': 0}, 'gridUnits': true})
        .scaleToObject(1.25)
        .filter('ColorMatrix', {'saturate': 1})
        .belowTokens()
        .fadeOut(1000)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(10000)
        .zIndex(0.1)

        .effect()
        .delay(500)
        .file('jb2a.token_stage.round.blue.02.02')
        .atLocation(token, {'offset':{'y': 0}, 'gridUnits': true})
        .scaleToObject(1)
        .filter('ColorMatrix', {'saturate': 1})
        .belowTokens()
        .fadeOut(1000)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(10000)
        .zIndex(0.1)

        .wait(1000)
        
        .effect()
        .atLocation(token, {'offset': {'x': -0.25 * imageSize, 'y': -0.25 * imageSize}, 'randomOffset': 0.5, 'gridUnits': true})
        .shape('rectangle', {
            'lineSize': 4,
            'lineColor': '#FFFFFF',
            'fillColor': '#FFFFFF',
            'fillAlpha': 1,
            'width': 0.25 * imageSize,
            'height': 0.25 * imageSize,
            'gridUnits': true,
            'name': 'future'
        })
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .fadeOut(500)
        .duration(500)
        .animateProperty('sprite', 'position.y', { 'from': -0, 'to': -0.5, 'duration': 500, 'gridUnits': true})
        .repeats(16, 100,100)

        .effect()
        .atLocation(token, {'randomOffset': 0.5})
        .shape('rectangle', {
            'lineSize': 4,
            'lineColor': '#FFFFFF',
            'fillColor': '#FFFFFF',
            'fillAlpha': 1,
            'width': 0.25 * imageSize,
            'height': 0.25 * imageSize,
            'gridUnits': true,
            'name': 'future2'
        })
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .fadeOut(500)
        .duration(500)
        .animateProperty('sprite', 'position.y', { 'from': 0, 'to': -0.5, 'duration': 500, 'gridUnits': true})
        .repeats(16, 100,100)

        .wait(100)

        .effect()
        .file(image)
        .atLocation(token)
        .scaleToObject(1, {'considerTokenScale': true})
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1,  'brightness':50})
        .filter('Blur', {'blurX': 5, 'blurY': 5 })
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .duration(2200)
        .attachTo(token, {'bindAlpha': false})
        .waitUntilFinished(-800)

        .effect()
        .delay(400)
        .file(`jb2a.particles.outward.white.01.03`)
        .attachTo(token, {'offset': {'y': 0.2}, 'gridUnits': true, 'followRotation': false})
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'width', {'from': 0, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack'})
        .animateProperty('sprite', 'height', {'from': 0, 'to': 1.0, 'duration': 1000, 'gridUnits': true, 'ease': 'easeOutBack'})
        .animateProperty('sprite', 'position.y', {'from': -0, 'to': -0.6, 'duration': 1000, 'gridUnits': true})
        .opacity(1)
        .zIndex(0.3)

        .animation()
        .on(token)
        .fadeIn(500)

        .play();
}
export let summonEffects = {
    'default': defaultAnimation,
    'celestial': celestial,
    'fiend': fiend,
    'fire': fire,
    'water': water,
    'air': air,
    'earth': earth,
    'nature': nature,
    'shadow': shadow,
    'future': future
};