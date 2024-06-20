import {animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, workflowUtils} from '../../utils.js'

async function hit({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.meleeAttacks.includes(workflow.item?.system?.actionType)) return;
    let targetToken = workflow.hitTargets.first();
    let effect = effectUtils.getEffectByIdentifier(targetToken.actor, 'armorOfAgathys');
    if (!effect) return;
    let damage = effect.flags['midi-qol'].castData.castLevel * 5;
    let tempHP = targetToken.actor.system.attributes.hp.temp;
    if (tempHP === 0) await genericUtils.remove(effect);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Armor of Agathys: Reflect', {object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let damageType = 'cold'; // TODO: customize?
    featureData.system.damage.parts[0] = [
        damage, // TODO: add damage type flavor?
        damageType
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, effect.parent, [workflow.token]);
    //Animations by: eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.impact.004.blue')
        .atLocation(targetToken)
        .rotateTowards(workflow.token)
        .scaleToObject(1.45)
        .spriteScale({'x': 0.75, 'y': 1.0 })
        .filter('ColorMatrix', {'saturate': -0.75, 'brightness': 1.5})
        .spriteOffset({'x': -0.15}, {'gridUnits': true})

        .effect()
        .atLocation(targetToken)
        .file('jb2a.side_impact.part.fast.ice_shard.blue')
        .rotateTowards(workflow.token)
        .scaleToObject(2)
        .randomizeMirrorY()
        .zIndex(2)

        .effect()
        .from(workflow.token)
        .atLocation(workflow.token)
        .fadeIn(100)
        .fadeOut(100)
        .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 175, 'pingPong': true, 'gridUnits': true})
        .scaleToObject(workflow.token.document.texture.scaleX)
        .duration(500)
        .opacity(0.15)

        .play();
}
async function use({workflow}) {
    let effect = workflow.actor.effects.getName(workflow.item.name);
    if (!effect) return;
    let token = workflow.token;
    // TODO: will it auto-apply macro.effects & identifier at some point?
    await genericUtils.update(effect, {
        'flags.chris-premades': {
            'identifier': 'armorOfAgathys',
            'macros.effect': ['armorOfAgathys'],
            'armorOfAgathys.tokenUuid': token.document.uuid
        }
    });
    if (animationUtils.jb2aCheck() !== 'patreon') return;
    new Sequence()
        .effect()
        .file('jb2a.ward.rune.dark_purple.01')
        .atLocation(token)
        .scaleToObject(1.85)
        .belowTokens()
        .fadeOut(3000)
        .scaleIn(0, 500, {ease: 'easeOutCubic'})
        .filter('ColorMatrix', {brightness: 2, saturate: -0.75, hue: -75})

        .effect()
        .attachTo(token)
        .delay(250)
        .file('jb2a.magic_signs.rune.02.complete.06.blue')
        .scaleToObject(0.75 * token.document.texture.scaleX)
        .scaleIn(0, 500, {ease: 'easeOutCubic'})
        .playbackRate(2.5)
        .opacity(1)
        .zIndex(3)

        .effect()
        .attachTo(token)
        .file('jb2a.extras.tmfx.border.circle.inpulse.01.fast')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .zIndex(3)

        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.extras.tmfx.inflow.circle.01')
        .scaleToObject(1 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .opacity(0.9)
        .zIndex(2)
        .extraEndDuration(1500)
        .private()
        .persist()
        
        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.extras.tmfx.outflow.circle.01')
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .opacity(0.9)
        .extraEndDuration(1500)
        .zIndex(1)
        .private()
        .persist()
        
        .effect()   
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.template_circle.symbol.normal.snowflake.blue')
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .opacity(0.75)
        .extraEndDuration(1500)
        .zIndex(2)
        .private()
        .persist()
        
        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.shield.01.loop.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist()
        
        .waitUntilFinished(-1000)
        .play();
}
async function end({entity}) {
    let tokenUuid = entity.flags?.['chris-premades']?.armorOfAgathys?.tokenUuid;
    let tokenDoc = await fromUuid(tokenUuid);
    if (!tokenDoc) return;
    let token = tokenDoc.object;
    if (animationUtils.jb2aCheck() !== 'patreon') return;
    Sequencer.EffectManager.endEffects({name: 'Armor of Agathys', object: token});
    new Sequence()
        .effect()
        .attachTo(token)
        .file('jb2a.shield.01.outro_explode.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeOut(500)
        .zIndex(1)

        .play();
}
export let armorOfAgathys = {
    name: 'Armor of Agathys',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 250
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
}