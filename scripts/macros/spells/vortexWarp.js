import {chris} from '../../helperFunctions.js';
export async function vortexWarp({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let targetToken = workflow.targets.first();
    let maxRange = 90 + (30 * (workflow.castData.castLevel - 2));
    let icon = targetToken.document.texture.src;
    let interval = targetToken.document.width % 2 === 0 ? 1 : -1;
    await workflow.actor.sheet.minimize();
    let position = await chris.aimCrosshair(workflow.token, maxRange, icon, interval, targetToken.document.width);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        return;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
    if (animation === 'simple' || chris.jb2aCheck() === 'free') {
        await new Sequence()
            .effect()
            .file('jb2a.misty_step.01.blue')
            .atLocation(targetToken)
            .randomRotation()
            .scaleToObject(2)
            .wait(750)
            .animation()
            .on(targetToken)
            .opacity(0.0)
            .waitUntilFinished()
            .play();
        let newCenter = canvas.grid.getSnappedPosition(position.x - targetToken.w / 2, position.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x,
                'y': newCenter.y
            }
        };
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name,
            'updateOpts': {'token': {'animate': false}}
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
        await new Sequence()
            .effect()
            .file('jb2a.misty_step.02.blue')
            .atLocation(targetToken)
            .randomRotation()
            .scaleToObject(2)
            .wait(1500)
            .animation()
            .on(targetToken)
            .opacity(1.0)
            .play();
        await warpgate.wait(1000);
    } else {
        //Animations by: eskiemoh
        new Sequence()
            .effect()
            .from(targetToken)
            .duration(1500)
            .scaleOut(0, 500, {'ease': 'easeInOutElastic'})
            .rotateOut(180, 300, {'ease': 'easeOutCubic'})
            .animateProperty('sprite', 'position.y', {'from': 0 , 'to': -0.25, 'gridUnits': true, 'duration': 100, 'delay': 1000})
            .animateProperty('sprite', 'position.y', {'from': -0.25 , 'to': 0, 'gridUnits': true, 'duration': 100, 'delay': 1100})
            
            .animation()
            .delay(100)
            .on(targetToken)
            .opacity(0)
            
            .effect()
            .file('jb2a.particles.outward.white.01.02')
            .scaleIn(0, 500, {ease: 'easeOutQuint'})
            .delay(1000)
            .fadeOut(1000)
            .atLocation(targetToken)
            .duration(1000)
            .size(1.35, {'gridUnits': true})
            .animateProperty('spriteContainer', 'position.y', {'from':0 , 'to': -0.5, 'gridUnits': true, 'duration': 1000})
            .zIndex(1)
            
            .effect()
            .file('jb2a.portals.horizontal.vortex.purple')
            .atLocation(targetToken)
            .scaleToObject(0.5)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 600, {'ease': 'easeOutCubic'})
            .opacity(1)
            .duration(1500)
            .belowTokens()
            .zIndex(0)
            
            .effect()
            .file('jb2a.extras.tmfx.outflow.circle.04')
            .atLocation(targetToken)
            .scaleToObject(2.5)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 600, {'ease': 'easeOutCubic'})
            .fadeOut(1000)
            .opacity(0.2)
            .belowTokens()
            .zIndex(0)
            
            .effect()
            .file('jb2a.template_circle.vortex.intro.purple')
            .atLocation(targetToken)
            .scaleToObject(1.9)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 600, {'ease': 'easeOutCubic'})
            .opacity(1)
            .belowTokens()
            .zIndex(1)
            .waitUntilFinished()
            
            .animation()
            .on(targetToken)
            .teleportTo(position)
            .snapToGrid()
            .offset({'x': -1, 'y': -1 })
            .waitUntilFinished(200)
            
            .effect()
            .file('jb2a.portals.horizontal.vortex.purple')
            .atLocation(targetToken)
            .scaleToObject(0.5)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 600, {'ease': 'easeOutCubic'})
            .opacity(1)
            .duration(1500)
            .belowTokens()
            .zIndex(0)
            
            .effect()
            .file('jb2a.template_circle.vortex.outro.purple')
            .atLocation(targetToken)
            .scaleToObject(1.9)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 500, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 500, {'ease': 'easeOutCubic'})
            .opacity(1)
            .belowTokens()
            .zIndex(1)
            
            .effect()
            .file('jb2a.extras.tmfx.outflow.circle.04')
            .atLocation(targetToken)
            .scaleToObject(2.5)
            .rotateIn(-360, 500, {'ease': 'easeOutCubic'})
            .rotateOut(360, 500, {'ease': 'easeOutCubic'})
            .scaleIn(0, 500, {'ease': 'easeInOutCirc'})
            .scaleOut(0, 500, {'ease': 'easeOutCubic'})
            .opacity(0.2)
            .fadeOut(1000)
            .belowTokens()
            .zIndex(0)
            
            .effect()
            .file('jb2a.particles.outward.white.01.02')
            .delay(250)
            .scaleIn(0, 500, {'ease': 'easeOutQuint'})
            .fadeOut(1000)
            .atLocation(targetToken)
            .duration(1000)
            .size(1.35, {'gridUnits': true})
            .animateProperty('spriteContainer', 'position.y', {'from':0 , 'to': -0.5, 'gridUnits': true, 'duration': 1000})
            .zIndex(1)
            
            .effect()
            .from(targetToken)
            .delay(250)
            .atLocation(targetToken)
            .duration(1500)
            .scaleIn({'x': 0.2, 'y': 0 }, 1000, {'ease': 'easeOutElastic'})
            .rotateIn(360, 500, {ease: 'easeOutCubic'})
            .animateProperty('spriteContainer', 'position.y', {'from':0 , 'to': -0.5, 'gridUnits': true, 'duration': 200})
            .animateProperty('spriteContainer', 'position.y', {'from':-0.5 , 'to': 0, 'gridUnits': true, 'duration': 200, 'delay': 200})
            .waitUntilFinished(-200)
            
            .animation()
            .on(targetToken)
            .opacity(1)
            
            .play();
        await warpgate.wait(4000);
    }
    await workflow.actor.sheet.maximize();
}