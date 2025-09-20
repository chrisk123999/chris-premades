import {animationUtils, combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || workflow.isFumble || workflow.item.type !== 'weapon') return;
    let classLevels = workflow.actor.classes.cleric?.system?.levels;
    let subclassIdentifier = workflow.actor.classes.cleric?.subclass?.identifier;
    if (!classLevels || !subclassIdentifier) return;
    if (!combatUtils.perTurnCheck(item, 'divineStrike', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let damageType = itemUtils.getConfig(item, 'damageType');
    if (!damageType || damageType === 'default') {
        switch (subclassIdentifier.split('-')[0]) {
            case 'death':
                damageType = 'necrotic';
                break;
            case 'forge':
                damageType = 'fire';
                break;
            case 'nature':
                damageType = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Config.DamageType', [
                    ['DND5E.DamageCold', 'cold'],
                    ['DND5E.DamageFire', 'fire'],
                    ['DND5E.DamageLightning', 'lightning']
                ]);
                damageType = damageType ?? 'cold';
                break;
            case 'order':
                damageType = 'psychic';
                break;
            case 'tempest':
                damageType = 'thunder';
                break;
            case 'trickery':
                damageType = 'poison';
                break;
            case 'war':
                damageType = workflow.defaultDamageType;
                break;
            default:
                damageType = 'radiant';
                break;
        }
    }
    let diceNumber = classLevels >= 14 ? 2 : 1;
    let bonusFormula = diceNumber + 'd8';
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType});
    await combatUtils.setTurnCheck(item, 'divineStrike');
    let playAnimation = itemUtils.getConfig(item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    if (!playAnimation) return;
    let target = workflow.targets.first();
    if (workflowUtils.isAttackType(workflow, 'rangedAttack')) {
        let distance = {
            x: (workflow.token.center.x - target.center.x),
            y: (workflow.token.center.y - target.center.y),
        };
        let midpoint = {
            x: (workflow.token.center.x + target.center.x) / 2,
            y: (workflow.token.center.y + target.center.y) / 2,
        };
        let offset = [
            {x:distance.x/4, y:distance.y/4},
            {x:distance.x/12, y:distance.y/12},
            {x:-distance.x/12, y:-distance.y/12},
            {x:-distance.x/4, y:-distance.y/4},
        ];
        let randomOffset;
        if (Math.abs(distance.x) > Math.abs(distance.y)) {
            randomOffset = [
                {x:-0, y:0.2},
                {x:0, y:-0.35},
                {x:-0, y:0.35},
                {x:0, y:-0.2},
            ];    
        } else {
            randomOffset = [
                {x:-0.2, y:0},
                {x:0.35, y:-0},
                {x:-0.35, y:0},
                {x:0.2, y:-0},
            ];
        }
        for (let i = 0; i < 4; i++) {
            /* eslint-disable indent */
            new Sequence()
                .wait(100)
                .effect()
                    .name('DivineStrike')
                    .delay(10 + 50 * i)
                    .file('jb2a.twinkling_stars.points04.white')
                    .atLocation(midpoint, {offset: randomOffset[i], gridUnits: true})
                    .scaleToObject(0.5, {gridUnits: true})
                    .scaleIn(0, 500, {ease: 'easeOutBack'})
                    .scaleOut(0, 250, {ease: 'easeOutCubic'})
                    .duration(1000 - (10 + 50 * i))
                    .spriteOffset(offset[i], {gridUnits: false})
                    .zIndex(2)
                .effect()
                    .name('point')
                    .delay(10 + 50 * i)
                    .file('animated-spell-effects-cartoon.energy.pulse.yellow')
                    .atLocation(midpoint, {offset: randomOffset[i], gridUnits: true})
                    .scaleToObject(0.5, {gridUnits: true})
                    .spriteOffset(offset[i],{gridUnits: false})
                    .filter('ColorMatrix', {saturate: -1})
                    .zIndex(2)
                .play();
        }
        new Sequence()
            .wait(500)
            .effect()
                .file('jb2a.ranged.02.projectile.01.yellow')
                .atLocation(workflow.token)
                .stretchTo(target)
                .opacity(1)
                .playbackRate(1.5)
                .filter('ColorMatrix', {saturate:0.25 })
                .randomizeMirrorY()
                .filter('ColorMatrix', {saturate:-1, hue: 150})
                .zIndex(0.2)
            .effect()
                .file('jb2a.ranged.03.projectile.01.pinkpurple')
                .atLocation(workflow.token)
                .stretchTo(target)
                .opacity(1)
                .playbackRate(1.5)
                .randomizeMirrorY()
                .filter('ColorMatrix', {brightness: 0})
                .zIndex(0.1)
            .play();     
    } else {
        let offset = [
            {x: 0.3 * workflow.token.document.width, y: -0.85 * workflow.token.document.width},
            {x: 0.25 * workflow.token.document.width, y: -0.45 * workflow.token.document.width},
            {x: -0.2 * workflow.token.document.width, y: -0.4 * workflow.token.document.width},
            {x: -0.05 * workflow.token.document.width, y: -0 * workflow.token.document.width},
        ];
        for (let i = 0; i < 4; i++) {
            new Sequence()
                .wait(100)
                .effect()
                    .name('DivineStrike')
                    .delay(10 + 50 * i)
                    .file('jb2a.twinkling_stars.points04.white')
                    .atLocation(target)
                    .rotateTowards(workflow.token)
                    .scaleToObject(0.4, {gridUnits: true})
                    .scaleIn(0, 500, {ease: 'easeOutBack'})
                    .scaleOut(0, 250, {ease: 'easeOutCubic'})
                    .duration(1000 - (10 + 50 * i))
                    .spriteOffset(offset[i], {gridUnits: true})
                    .zIndex(2)
                .effect()
                    .name('point')
                    .delay(10 + 50 * i)
                    .file('animated-spell-effects-cartoon.energy.pulse.yellow')
                    .atLocation(target)
                    .rotateTowards(workflow.token)
                    .scaleToObject(0.4, {gridUnits: true})
                    .spriteOffset(offset[i], {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1})
                    .zIndex(2)
                .play();
        }
        new Sequence()
            .wait(500)
            .canvasPan()
            .delay(300)
            .shake({duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000})
            .effect()
                .delay(300)
                .file('jb2a.impact.ground_crack.01.purple')
                .atLocation(target)
                .size(2.3 * workflow.token.document.width, {gridUnits: true})
                .filter('ColorMatrix', {saturate: -0, brightness: 0})
                .belowTokens()
                .playbackRate(0.85)
                .randomRotation()
            .effect()
                .delay(300)
                .file('jb2a.particles.outward.white.02.03')
                .scaleIn(0, 500, {ease: 'easeOutQuint'})
                .fadeOut(1500)
                .atLocation(target)
                .duration(1500)
                .size(2.15, {gridUnits: true})
                .zIndex(5)
            .effect()
                .delay(300)
                .file('animated-spell-effects-cartoon.energy.pulse.yellow')
                .atLocation(target)
                .scaleToObject(1.75)
                .filter('ColorMatrix', {saturate: -1})
                .zIndex(1.1)
            .effect()
                .file('jb2a.divine_smite.target.yellowwhite')
                .attachTo(target, {bindScale: false})
                .rotateTowards(workflow.token)
                .scaleToObject(2)
                .spriteOffset({x: -1.0 * workflow.token.document.width, y: -0 * workflow.token.document.width}, {gridUnits: true})
                .mirrorY()
                .rotate(90)
                .filter('ColorMatrix', {saturate: -0.35, hue: 150})
                .zIndex(1)
                .wait(250)
            .play();
        /* eslint-enable indent */   
    }
}
export let divineStrike = {
    name: 'Divine Strike',
    version: '1.1.0',
    hasAnimaton: true,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'default',
            category: 'homebrew',
            homebrew: true,
            options: () => Object.entries(CONFIG.DND5E.damageTypes).map(i => ({label: i[1].label, value: i[0]})).concat({label: 'DND5E.Default', value: 'default'})
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};