import {animationUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function animation(target, token, attackType) {
    //Animations by: eskiemoh
    let hitSeq = new Sequence()
        .effect()
        .from(target)
        .atLocation(target)
        .fadeIn(100)
        .fadeOut(100)
        .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 75, 'pingPong': true, 'gridUnits': true})
        .scaleToObject(target.document.texture.scaleX)
        .duration(500)
        .opacity(0.15)
        .tint('#fd0706')

        .effect()
        .file('jb2a.particles.outward.red.01.04')
        .atLocation(target)
        .fadeIn(100)
        .fadeOut(400)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'}) 
        .scaleToObject(1.65 * target.document.texture.scaleX)
        .duration(800)
        .opacity(1)
        .randomRotation(true)
        .filter('ColorMatrix', {'saturate': 1 })
        .belowTokens(true);
    switch (attackType) {
        case 'slashing':
            new Sequence()
                .effect()
                .file('animated-spell-effects-cartoon.water.105')
                .atLocation(token)
                .scale(0.2 * token.document.width)
                .rotateTowards(target)
                .spriteRotation(80)
                .spriteOffset({'x':-0.15 * token.document.width, 'y': -0.1 * token.document.width}, {'gridUnits': true})
                .filter('ColorMatrix', { saturate: 0.75 })
                .rotateIn(-45, 250, {'ease': 'easeOutExpo'})
                .zIndex(1)

                .effect()
                .file('jb2a.melee_generic.slashing.one_handed')
                .atLocation(token)
                .scale(0.5 * token.document.width)
                .rotateTowards(target)
                .mirrorY()
                .spriteOffset({'x':- 1.7 * token.document.width}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': -1, 'brightness': -1 })
                .rotateIn(-90, 250, {'ease': 'easeOutBack'})
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
                .atLocation(target)
                .scale(0.17 * token.document.width)
                .rotateTowards(token)
                .spriteRotation(0)
                .spriteOffset({'x': -0.45 * token.document.width, 'y': 0}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': 0.75 })
                .scaleIn(0, 250, {'ease': 'easeOutExpo'})
                .zIndex(1)

                .effect()
                .file('jb2a.melee_generic.bludgeoning.two_handed')
                .atLocation(target)
                .scale(0.4 * token.document.width)
                .rotateTowards(token)
                .spriteRotation(180)
                .spriteOffset({'x': -1 * token.document.width, 'y':0}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': -1, 'brightness': -1 })
                .scaleIn(0, 250, {'ease': 'easeOutExpo'})
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
                .atLocation(target)
                .scale(0.2 * token.document.width)
                .rotateTowards(token)
                .spriteRotation(0)
                .spriteOffset({'x': -0.3 * token.document.width, 'y': 0}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': 0.75 })
                .scaleIn(0, 250, {'ease': 'easeOutExpo'})
                .zIndex(1)

                .effect()
                .file('animated-spell-effects-cartoon.water.115')
                .atLocation(target)
                .scale({'x':0.1 * token.document.width, 'y': 0.2 * token.document.width})
                .rotateTowards(token)
                .spriteRotation(0)
                .spriteOffset({'x': -0.4 * token.document.width, 'y': 0}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': -1, 'brightness': -1 })
                .scaleIn(0, 250, {'ease': 'easeOutExpo'})
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
                .atLocation(token)
                .scale(0.25 * token.document.width)
                .rotateTowards(target)
                .spriteRotation(18)
                .spriteOffset({'x': -0.6 * token.document.width, 'y': -0.25 * token.document.width}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': 0.75 })
                .rotateIn(-25, 250, {'ease': 'easeOutExpo'})
                .zIndex(1)

                .effect()
                .file('jb2a.melee_generic.piercing.one_handed')
                .atLocation(token)
                .scale(0.5 * token.document.width)
                .rotateTowards(target)
                .spriteRotation(15)
                .mirrorY()
                .spriteOffset({'x': -1.9 * token.document.width, 'y':-0.3 * token.document.width}, {'gridUnits': true})
                .filter('ColorMatrix', {'saturate': -1, 'brightness': -1 })
                .rotateIn(-25, 250, {'ease': 'easeOutExpo'})
                .zIndex(0)

                .thenDo(function(){
                    hitSeq.play();
                })
                .play();
            return;
    }
}
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    let weaponIdentifier = genericUtils.getIdentifier(workflow.item);
    if (!(workflow.activity.actionType === 'rwak' || workflow.item.system.properties.has('fin') || weaponIdentifier === 'psychicBlades')) return;
    if (!combatUtils.perTurnCheck(item, 'sneakAttack', false, workflow.token.id)) return;
    let doSneak = false;
    let displayRakish = false;
    let rollType = (workflow.advantage && workflow.disadvantage) ? 'normal' : (workflow.advantage && !workflow.disadvantage) ? 'advantage' : (!workflow.advantage && workflow.disadvantage) ? 'disadvantage' : 'normal';
    if (rollType === 'advantage') doSneak = true;
    let targetToken = workflow.targets.first();
    if (!doSneak && rollType != 'disadvantage') {
        let nearbyTokens = tokenUtils.findNearby(targetToken, 5, 'enemy', {includeIncapacitated: false}).filter(i => i.id != workflow.token.id);
        if (nearbyTokens.length) doSneak = true;
    }
    let rakishAudacity = itemUtils.getItemByIdentifier(workflow.actor, 'rakishAudacity');
    if (rakishAudacity && rollType != 'disadvantage' && !doSneak && (tokenUtils.getDistance(workflow.token, targetToken) <= 5)) {
        let nearbyTokens = tokenUtils.findNearby(workflow.token, 5, 'all', {includeIncapacitated: true}).filter(i => i.id != targetToken.id);
        if (!nearbyTokens.length) {
            doSneak = true;
            displayRakish = true;
        }
    }
    let insightfulFightingEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'insightfulFighting');
    let iTarget = false;
    if (insightfulFightingEffect && rollType != 'disadvantage') {
        let effectTarget = insightfulFightingEffect.flags['chris-premades']?.insightfulFighting?.target;
        if (effectTarget === targetToken.document.uuid) {
            doSneak = true;
            iTarget = true;
        }
    }
    if (!doSneak) return;
    let autoSneak = itemUtils.getConfig(item, 'auto');
    if (!autoSneak) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SneakAttack.Use', {name: item.name}));
        if (!selection) return;
    }
    let rendMind = itemUtils.getItemByIdentifier(workflow.actor, 'rendMind');
    let psionicEnergy = itemUtils.getItemByIdentifier(workflow.actor, 'psionicEnergy');
    if (weaponIdentifier === 'psychicBlades' && rendMind && psionicEnergy) await genericUtils.setFlag(workflow.item, 'chris-premades', 'rendMind.prompt', true);
    await combatUtils.setTurnCheck(item, 'sneakAttack');
    let bonusDamageFormula = itemUtils.getConfig(item, 'formula');
    if (!bonusDamageFormula || bonusDamageFormula === '') {
        if (workflow.actor.type === 'character') {
            let scale = workflow.actor.system.scale?.rogue?.['sneak-attack'];
            if (scale) {
                let number = scale.number;
                bonusDamageFormula = number + 'd' + scale.faces;
            } else {
                genericUtils.notify('CHRISPREMADES.Macros.SneakAttack.Scale', 'warn');
                return;
            }
        } else if (workflow.actor.type === 'npc') {
            let number = Math.ceil(workflow.actor.system.details.cr / 2);
            bonusDamageFormula = number + 'd6';
        }
    }
    let eyeFeature = itemUtils.getItemByIdentifier(workflow.actor, 'eyeForWeakness');
    if (iTarget && eyeFeature) bonusDamageFormula += ' + 3d6';
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: workflow.defaultDamageType});
    await workflowUtils.completeItemUse(item);
    if (displayRakish) await workflowUtils.completeItemUse(rakishAudacity);
    if (iTarget) {
        let feature = itemUtils.getItemByIdentifier(workflow.actor, 'insightfulFighting');
        if (feature) await feature.displayCard();
        if (eyeFeature) await workflowUtils.completeItemUse(eyeFeature);
    }
    let playAnimation = itemUtils.getConfig(item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    if (!playAnimation) return;
    let animationType;
    if (tokenUtils.getDistance(workflow.token, targetToken) > genericUtils.handleMetric(5)) animationType = 'ranged';
    if (!animationType) animationType = workflow.defaultDamageType;
    await animation(targetToken, workflow.token, animationType);
}
async function combatEnd({trigger}) {
    await combatUtils.setTurnCheck(trigger.entity, 'sneakAttack', true);
}
export let sneakAttack = {
    name: 'Sneak Attack',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 215
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ],
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'auto',
            label: 'CHRISPREMADES.SneakAttack.Auto',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ],
    utilFunctions: {
        animation
    }
};