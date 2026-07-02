import {animationUtils} from '../../proxy.mjs';
function rage(document, sourceToken) {
    new Sequence()
        
        .effect()
        .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
        .atLocation(sourceToken)
        .size(4, {gridUnits: true})
        .opacity(0.25)
        
        .effect()
        .file('jb2a.impact.ground_crack.orange.02')
        .atLocation(sourceToken)
        .belowTokens()
        .filter('ColorMatrix', {hue: -15,saturate: 1})
        .size(3.5, {gridUnits: true})
        .zIndex(1)
        
        .effect()
        .file('jb2a.impact.ground_crack.still_frame.02')
        .atLocation(sourceToken)
        .belowTokens()
        .fadeIn(1000)
        .filter('ColorMatrix', {hue: -15,saturate: 1})
        .size(3.5, {gridUnits: true})
        .zIndex(0)
        .duration(8000)
        .fadeOut(3000)
        
        .effect()
        .file('jb2a.wind_stream.white')
        .atLocation(sourceToken, {offset: {y:-0.05}, gridUnits: true})
        .size(1.75, {gridUnits: true})
        .rotate(90)
        .opacity(0.9)
        .filter('ColorMatrix', {saturate: 1})
        .tint('#FF0000')
        .loopProperty('sprite', 'position.y', {from: -5, to: 5, duration: 50, pingPong: true})
        .duration(8000)
        .fadeOut(3000)
        
        .effect()
        .file('jb2a.particles.outward.orange.01.03')
        .atLocation(sourceToken)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty('sprite', 'position.x', {from: -5, to: 5, duration: 50, pingPong: true})
        .animateProperty('sprite', 'position.y', {from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000})
        .duration(8000)
        
        .effect()
        .file('jb2a.wind_stream.white')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter('ColorMatrix', {saturate: 1})
        .tint('#FF0000')
        .persist()
        .tieToDocuments(document)
        
        .effect()
        .file('jb2a.token_border.circle.static.orange.012')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .opacity(0.6)
        .scaleToObject(1.9)
        .filter('ColorMatrix', {saturate: 1})
        .tint('#FF0000')
        .persist()
        .tieToDocuments(document)

        .play();
}
function lightning(document, sourceToken) {
    new Sequence()

        .effect()
        .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
        .atLocation(sourceToken)
        .size(4, {gridUnits: true})
        .opacity(0.25)

        .effect()
        .file('jb2a.impact.ground_crack.purple.02')
        .atLocation(sourceToken)
        .belowTokens()
        .filter('ColorMatrix', {hue: -15,saturate: 1})
        .size(3.5, {gridUnits: true})
        .zIndex(1)

        .effect()
        .file('jb2a.impact.ground_crack.still_frame.02')
        .atLocation(sourceToken)
        .belowTokens()
        .fadeIn(1000)
        .filter('ColorMatrix', {hue: -15,saturate: 1})
        .size(3.5, {gridUnits: true})
        .duration(8000)
        .fadeOut(3000)
        .zIndex(0)

        .effect()
        .file('jb2a.static_electricity.03.purple')
        .atLocation(sourceToken)
        .size(3, {gridUnits: true})
        .rotate(90)
        .randomRotation()
        .opacity(0.75)
        .belowTokens()
        .duration(8000)
        .fadeOut(3000)

        .effect()
        .file('jb2a.particles.outward.purple.01.03')
        .atLocation(sourceToken)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty('sprite', 'position.x', {from: -5, to: 5, duration: 50, pingPong: true})
        .animateProperty('sprite', 'position.y', {from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000})
        .duration(8000)

        .effect()
        .file('jb2a.static_electricity.03.purple')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .persist()
        .tieToDocuments(document)

        .effect()
        .file('jb2a.token_border.circle.static.purple.009')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .belowTokens()
        .opacity(1)
        .scaleToObject(2.025)
        .persist()
        .tieToDocuments(document)
        .zIndex(5)

        .play();
}
function saiyan(document, sourceToken) {
    new Sequence()

        .effect()
        .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
        .atLocation(sourceToken)
        .size(4, {gridUnits: true})
        .opacity(0.25)

        .effect()
        .file('jb2a.impact.ground_crack.orange.02')
        .atLocation(sourceToken)
        .belowTokens()
        .filter('ColorMatrix', {hue: 20,saturate: 1})
        .size(3.5, {gridUnits: true})
        .zIndex(1)

        .effect()
        .file('jb2a.impact.ground_crack.still_frame.02')
        .atLocation(sourceToken)
        .belowTokens()
        .fadeIn(2000)
        .filter('ColorMatrix', {hue: -15,saturate: 1})
        .size(3.5, {gridUnits: true})
        .duration(8000)
        .fadeOut(3000)
        .zIndex(0)

        .effect()
        .file('jb2a.wind_stream.white')
        .atLocation(sourceToken, {offset:{y:75}})
        .size(1.75, {gridUnits: true})
        .rotate(90)
        .opacity(1)
        .loopProperty('sprite', 'position.y', {from: -5, to: 5, duration: 50, pingPong: true})
        .duration(8000)
        .fadeOut(3000)
        .tint('#FFDD00')

        .effect()
        .file('jb2a.particles.outward.orange.01.03')
        .atLocation(sourceToken)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty('sprite', 'position.x', {from: -5, to: 5, duration: 50, pingPong: true})
        .animateProperty('sprite', 'position.y', {from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000})
        .duration(8000)

        .effect()
        .file('jb2a.wind_stream.white')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter('ColorMatrix', {saturate: 1})
        .tint('#FFDD00')
        .persist()
        .tieToDocuments(document)

        .effect()
        .file('jb2a.token_border.circle.static.orange.012')
        .atLocation(sourceToken)
        .name('Rage')
        .attachTo(sourceToken)
        .opacity(0.7)
        .scaleToObject(1.9)
        .filter('ColorMatrix', {hue: 30, saturate: 1 , contrast: 0, brightness: 1})
        .persist()
        .tieToDocuments(document)

        .play();
}
export const rageDefault = {
    name: 'CHRISPREMADES.Animations.Default',
    macros: {
        play: rage
    },
    inputs: ['document', 'sourceToken'],
    requirements: ['jb2a_patreon'],
    type: 'classFeature',
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};
export const rageLightning = {
    name: 'CHRISPREMADES.Animations.Rage.Lightning',
    macros: {
        play: lightning
    },
    inputs: ['document', 'sourceToken'],
    requirements: ['jb2a_patreon'],
    type: 'classFeature',
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};
export const rageSaiyan = {
    name: 'CHRISPREMADES.Animations.Rage.Saiyan',
    macros: {
        play: saiyan
    },
    inputs: ['document', 'sourceToken'],
    requirements: ['jb2a_patreon'],
    type: 'classFeature',
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};
