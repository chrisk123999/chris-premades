import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {colorMatrix} from './colorMatrix.js';
let spellSchools = {
    'abj': {
        'name': 'abjuration',
        'color': 'blue'
    },
    'con': {
        'name': 'conjuration',
        'color': 'yellow'
    },
    'div': {
        'name': 'divination',
        'color': 'blue'
    },
    'enc': {
        'name': 'enchantment',
        'color': 'pink'
    },
    'evo': {
        'name': 'evocation',
        'color': 'red'
    },
    'ill': {
        'name': 'illusion',
        'color': 'purple'
    },
    'nec': {
        'name': 'necromancy',
        'color': 'green'
    },
    'trs': {
        'name': 'transmutation',
        'color': 'yellow'
    }
};
export async function spellsAnimations(workflow) {
    if (await chris.animationCheck(workflow.item)) return;
    if (!workflow.token || workflow.item?.type != 'spell' || workflow.targets.size < 1) return;
    let school = workflow.item.system.school;
    if (!school) return;
    let distance = chris.getDistance(workflow.token, workflow.targets.first());
    if (!distance) return;
    let damageTypes = [];
    for (let i = 0; workflow.item.system.damage.parts.length > i; i++) {
        let flavor = workflow.item.system.damage.parts[i][1];
        if (!flavor) continue;
        if (damageTypes.includes(flavor.toLowerCase()) === false && flavor != 'healing' && flavor != 'temphp' && flavor != 'none' && flavor != 'midi-none') damageTypes.push(flavor);
    }
    if (workflow.item.system.actionType === 'save' && distance > 5) {
        await saveRanged();
        return;
    }
    if (workflow.item.system.actionType === 'heal') {
        await heal();
        return;
    }
    if (distance === 5) {
        await melee();
        return;
    }
    if (constants.spellAttacks.includes(workflow.item.system.actionType)) {
        await ranged();
        return;
    }
    async function melee() {
        for (let i of workflow.targets) {
            new Sequence()
                .effect()
                    .file('jb2a.cast_generic.fire.side01.orange.0')
                    .filter('ColorMatrix', colorMatrix('jb2a.cast_generic.fire.side01.orange.0', school))
                    .atLocation(i, {local: true, gridUnits: true})
                    .anchor({x:0.15})
                    .scaleToObject(2)
                    .rotateTowards(workflow.token)
                    .playbackRate(1)
                .play();
        }
    }
    async function ranged() {
        await new Sequence()
            .effect()
                .file('jb2a.cast_generic.01.yellow.0')
                .filter('ColorMatrix', colorMatrix('jb2a.cast_generic.01.yellow.0', school))
                .atLocation(workflow.token)
                .scaleToObject(1.25)
                .playbackRate(0.75)
                .waitUntilFinished()
            .play();
        Hooks.once('midi-qol.DamageRollComplete', async function() {
            if (workflow.isFumble) return;
            let missed = (workflow.hitTargets.size < 1);
            for (let i of workflow.targets) {
                await new Sequence()
                    .effect()
                        .file('jb2a.template_line_piercing.generic.01.orange.15ft')
                        .filter('ColorMatrix', colorMatrix('jb2a.template_line_piercing.generic.01.orange.15ft', damageTypes[0]))
                        .atLocation(workflow.token)
                        .stretchTo(i, {offset: {x: -0.5}, local: true, gridUnits: true})
                        .playbackRate(0.75)
                        .waitUntilFinished(-400)
                        .missed(missed)
                    .play();
                if (!missed) {
                    await new Sequence()
                        .effect()
                            .file('jb2a.impact.010.orange')
                            .filter('ColorMatrix', colorMatrix('jb2a.impact.010.orange', damageTypes[0]))
                            .atLocation(i)
                            .scaleToObject(2)
                            .playbackRate(0.5)
                            .waitUntilFinished(-500)
                        .play();
                    if (workflow.isCritical) {
                        await new Sequence()
                            .effect()
                                .file('jb2a.impact.006.yellow')
                                .filter('ColorMatrix', colorMatrix('jb2a.impact.006.yellow', damageTypes[0]))
                                .atLocation(i)
                                .scaleToObject(3.5)
                                .playbackRate(0.65)
                            .play();
                    }
                }
            }
        })
    }
    async function saveRanged() {
        await new Sequence()
            .effect()
                .file('jb2a.cast_generic.02.blue.0')
                .filter('ColorMatrix', colorMatrix('jb2a.cast_generic.02.blue.0', school))
                .atLocation(workflow.token)
                .scaleToObject(1.25)
                .playbackRate(0.75)
                .waitUntilFinished()
            .play();
        Hooks.once('midi-qol.postCheckSaves', async function() {
            let color = damageTypes[0] ?? school;
            for (let i of workflow.targets) {
                await new Sequence()
                    .effect()
                        .file('jb2a.energy_strands.range.standard.purple.04')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_strands.range.standard.purple.04', color))
                        .atLocation(workflow.token)
                        .stretchTo(i, {offset: {x: -0.5}, local: true, gridUnits: true})
                        .playbackRate(1)
                    .effect()
                        .file('jb2a.energy_strands.in.green.01.0')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_strands.in.green.01.0', color))
                        .atLocation(i)
                        .scaleToObject(1.5)
                        .delay(500)
                        .playbackRate(1)
                        .waitUntilFinished()
                    .play();
            }
            for (let i of workflow.failedSaves) {
                let animationIntro = 'jb2a.magic_signs.rune.' + spellSchools[school].name  + '.intro.' + spellSchools[school].color;
                let animationOutro = 'jb2a.magic_signs.rune.' + spellSchools[school].name  + '.intro.' + spellSchools[school].color;
                new Sequence()
                    .effect()
                        .file(animationIntro)
                        .atLocation(i)
                        .scaleToObject(1)
                        .delay(200)
                        .playbackRate(0.75)
                    .effect()
                        .file(animationOutro)
                        .atLocation(i)
                        .delay(1500)
                        .playbackRate(0.75)
                        .scaleToObject(1)
                    .play();
            }
            for (let i of workflow.saves) {
                new Sequence()
                    .effect()
                        .file('jb2a.energy_field.02.above.blue')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_field.02.above.blue', school))
                        .duration(3000)
                        .startTime(1200)
                        .atLocation(i)
                        .scaleToObject(1)
                        .playbackRate(2)
                    .play();
            }
        })
    }
    async function heal() {
        await new Sequence()
            .effect()
                .file('jb2a.cast_generic.02.blue.0')
                .filter('ColorMatrix', colorMatrix('jb2a.cast_generic.02.blue.0', school))
                .atLocation(workflow.token)
                .scaleToObject(1.25)
                .playbackRate(0.75)
                .waitUntilFinished()
            .play();
        Hooks.once('midi-qol.DamageRollComplete', async function() {
            let color = school;
            for (let i of workflow.targets) {
                await new Sequence()
                    .effect()
                        .file('jb2a.energy_strands.in.green.01.2')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_strands.in.green.01.0', color))
                        .atLocation(i)
                        .scaleToObject(2)
                        .playbackRate(1)
                        .waitUntilFinished(-300)
                    .effect()
                        .file('jb2a.healing_generic.burst.greenorange')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_strands.in.green.01.0', color))
                        .atLocation(i)
                        .scaleToObject(2.5)
                        .playbackRate(1)
                        .waitUntilFinished(-2000)
                    .effect()
                        .file('jb2a.energy_field.02.above.blue')
                        .filter('ColorMatrix', colorMatrix('jb2a.energy_field.02.above.blue', school))
                        .duration(2300)
                        .startTime(1200)
                        .atLocation(i)
                        .scaleToObject(1)
                        .playbackRate(2.5)
                    .play();
            }
        })
    }
}