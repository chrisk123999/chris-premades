import {animationUtils, effectUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    // Animations by: eskiemoh
    if (!workflow.targets.size) return;
    for (let target of workflow.targets) {
        let targetDeath = workflow.damageList.find(i => i.targetUuid === target.document.id)?.newHP === 0;
        if (targetDeath && target.actor.type === 'character') await effectUtils.applyConditions(target.actor, ['dead']);
        let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
        if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon' || !animationUtils.aseCheck()) continue;
        let centerPoint = target.getCenterPoint();
        let seq = new Sequence()
            .effect()
            .atLocation(workflow.token)
            .file('jb2a.magic_signs.circle.02.transmutation.loop.dark_green')
            .scaleToObject(1.25)
            .rotateIn(180, 600, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {'from': 0, 'to': -360, 'duration': 10000})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)

            .effect()
            .atLocation(workflow.token)
            .file('jb2a.magic_signs.circle.02.transmutation.loop.dark_green')
            .scaleToObject(1.25)
            .rotateIn(180, 600, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {'from': 0, 'to': -360, 'duration': 10000})
            .belowTokens(true)
            .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
            .filter('Blur', {'blurX': 5, 'blurY': 10 })
            .zIndex(1)
            .duration(1200)
            .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 500})
            .fadeOut(300, {'ease': 'linear'})
            .zIndex(0.1)

            .effect()
            .file('jb2a.particles.outward.white.01.02')
            .scaleIn(0, 1000, {'ease': 'easeOutQuint'})
            .delay(500)
            .fadeOut(1000)
            .atLocation(workflow.token)
            .duration(1000)
            .size(1.75, {'gridUnits': true})
            .animateProperty('spriteContainer', 'position.y', {'from':0 , 'to': -0.5, 'gridUnits': true, 'duration': 1000})
            .zIndex(1)

            .effect()
            .file('jb2a.particles.outward.white.01.02')
            .scaleIn(0, 1000, {'ease': 'easeOutQuint'})
            .delay(500)
            .fadeOut(1000)
            .atLocation(workflow.token)
            .duration(1000)
            .size(1.75, {'gridUnits': true})
            .animateProperty('spriteContainer', 'position.y', {'from': 0 , 'to': -0.5, 'gridUnits': true, 'duration': 1000})
            .zIndex(1)
            .mirrorX()

            .wait(1000)

            .effect()
            .file('jb2a.extras.tmfx.border.circle.inpulse.01.fast')
            .atLocation(workflow.token)
            .tint('#d9df53')
            .scaleToObject(1.5)

            .wait(500);
        
        if (target !== workflow.token) {
            seq = seq
                .effect()
                .file('jb2a.disintegrate.green')
                .atLocation(workflow.token)
                .stretchTo(target)
                .missed(workflow.failedSaves.size === 0)
                .zIndex(1)
        
                .wait(500);
        }
        //Death Effect
        seq
            .animation()
            .on(target)
            .opacity(0)
            .playIf(targetDeath)

            .effect()
            .file('animated-spell-effects-cartoon.smoke.97')
            .atLocation(target, {'offset': {'y':-0.25}, 'gridUnits': true})
            .fadeIn(1000)
            .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
            .delay(1000)
            .duration(10000)
            .fadeOut(500)
            .scaleToObject(0.5)
            .filter('ColorMatrix', {'brightness': 0})
            .zIndex(0.1)
            .belowTokens()
            .playIf(targetDeath)

            .effect()
            .file('jb2a.spirit_guardians.green.particles')
            .atLocation(target)
            .duration(7500)
            .fadeOut(3000)
            .scaleToObject(0.35)
            .filter('ColorMatrix', {'hue': -25})
            .belowTokens()
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'fillColor': '#FF0000',
                'radius': 0.15,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
                
            })
            .duration(1500)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.2,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4},            
            })
            .duration(1800)
            .fadeOut(1000)
            .playIf(targetDeath)
                    
            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.25,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
            })
            .duration(2000)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.3,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
            })
            .duration(2200)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.35,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
            })   
            .duration(2400)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.4,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
            })
            .duration(2600)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.45,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.1, 'y': -canvas.grid.size * 0.4}, 
            })    
            .duration(2800)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'fillColor': '#FF0000',
                'radius': 0.15,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
                
            })
            .duration(500)
            .fadeOut(1000)
            .playIf(targetDeath)       

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.2,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3},           
            })
            .duration(700)
            .fadeOut(1000)
            .playIf(targetDeath)               

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.25,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            })
            .duration(900)
            .fadeOut(1000)
            .playIf(targetDeath)   

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.3,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            })
            .duration(1100)
            .fadeOut(1000)
            .playIf(targetDeath)    

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.35,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            })   
            .duration(1300)
            .fadeOut(1000)
            .playIf(targetDeath)    

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.4,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            })
            .duration(1500)
            .fadeOut(1000)
            .playIf(targetDeath)  

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.45,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            })   
            .duration(1700)
            .fadeOut(1000)
            .playIf(targetDeath)  

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.5,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y': canvas.grid.size * 0.3}, 
            }) 
            .duration(1900)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.55,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': -canvas.grid.size * 0.4, 'y' :canvas.grid.size * 0.3}, 
            })
            .duration(2100)
            .fadeOut(1000)
            .playIf(targetDeath) 

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'fillColor': '#FF0000',
                'radius': 0.15,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size*0.5, 'y': canvas.grid.size*0.4}, 
            })
            .duration(1500)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX) 
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.2,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4},  
            })
            .duration(1700)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX) 
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.25,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4},  
            })
            .duration(1900)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.3,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4}, 
            })
            .duration(2100)
            .fadeOut(1000)
            .playIf(targetDeath)

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.35,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4}, 
            })   
            .duration(2300)
            .fadeOut(1000)
            .playIf(targetDeath)
            
            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.4,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4}, 
            })
            .duration(2500)
            .fadeOut(1000)    

            .effect()
            .atLocation(centerPoint)
            .from(target)
            .scaleToObject(target.document.texture.scaleX)
            .shape('circle', {
                'lineSize': 25,
                'lineColor': '#FF0000',
                'radius': 0.45,
                'gridUnits': true,
                'name': 'test',
                'isMask': true,
                'offset': {'x': canvas.grid.size * 0.5, 'y': canvas.grid.size * 0.4}, 
            })    
            .duration(2700)
            .fadeOut(1000)
            .playIf(targetDeath)

            .wait(1500)

            .thenDo(async function() {
                if( targetDeath == true){
                    await target.document.update({
                        hidden: true
                    });
                }
            })

            .play();
    }
}
export let disintegrate ={
    name: 'Disintegrate',
    version: '1.3.84',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};