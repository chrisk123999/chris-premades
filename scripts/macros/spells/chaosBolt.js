import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
import {queue} from '../../utility/queue.js';
export async function chaosBolt({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let uuid = workflow.item.flags['chris-premades']?.spell?.chaosBolt?.uuid ?? workflow.item.uuid;
    let target = workflow.targets.first();
    let targetUuid = workflow.item.flags['chris-premades']?.spell?.chaosBolt?.targetUuid;
    let source = targetUuid ? fromUuidSync(targetUuid).object : workflow.token;
    let castLevel = workflow.item.flags['chris-premades']?.spell?.chaosBolt?.castLevel ?? workflow.castData.castLevel;
    let queueSetup = await queue.setup(uuid, 'chaosBolt', 50);
    if (!queueSetup) return;
    let documents = [
        null,
        {
            'img': 'icons/magic/acid/projectile-faceted-glob.webp',
            'name': translate.damageType('acid'),
            'type': 'acid',
            'animation': 'jb2a.magic_missile.green',
            'delay': -1000
        },
        {
            'img': 'icons/magic/air/wind-tornado-wall-blue.webp',
            'name': translate.damageType('cold'),
            'type': 'cold',
            'animation': 'jb2a.ray_of_frost.blue',
            'delay': -1500
        },
        {
            'img': 'icons/magic/fire/beam-jet-stream-embers.webp',
            'name': translate.damageType('fire'),
            'type': 'fire',
            'animation': 'jb2a.fire_bolt.orange',
            'delay': -1500
        },
        {
            'img': 'icons/magic/sonic/projectile-sound-rings-wave.webp',
            'name': translate.damageType('force'),
            'type': 'force',
            'animation': 'jb2a.eldritch_blast.purple',
            'delay': -3000
        },
        {
            'img': 'icons/magic/lightning/bolt-blue.webp',
            'name': translate.damageType('lightning'),
            'type': 'lightning',
            'animation': 'jb2a.chain_lightning.primary.blue',
            'delay': -1500
        },
        {
            'img': 'icons/magic/death/skull-poison-green.webp',
            'name': translate.damageType('poison'),
            'type': 'poison',
            'animation': 'jb2a.spell_projectile.skull.pinkpurple',
            'delay': -1500
        },
        {
            'img': 'icons/magic/control/fear-fright-monster-grin-red-orange.webp',
            'name': translate.damageType('psychic'),
            'type': 'psychic',
            'animation': 'jb2a.disintegrate.dark_red',
            'delay': -1750
        },
        {
            'img': 'icons/magic/sonic/explosion-shock-wave-teal.webp',
            'name': translate.damageType('thunder'),
            'type': 'thunder',
            'animation': 'jb2a.bullet.01.blue',
            'animation2': 'jb2a.shatter.blue',
            'delay': -1000,
            'delay2': -1500
        }
    ];
    let ignoreList = workflow.item.flags['chris-premades']?.spell?.chaosBolt?.ignoreList ?? [];
    let alwaysBounce = workflow.item.flags['chris-premades']?.spell?.chaosBolt?.alwaysBounce ?? chris.getConfiguration(workflow.item, 'alwaysbounce');
    let dice1 = workflow.damageRolls[0].terms[0].values[0];
    let dice2 = workflow.damageRolls[0].terms[0].values[1];
    let selection = documents[dice1];
    if (dice1 != dice2) {
        let choice = await chris.selectDocument(workflow.item.name, [documents[dice1], documents[dice2]]);
        if (choice) selection = choice[0];
    }
    workflow.damageRolls[0].options.type = selection.type;
    workflow.damageRolls[1].options.type = selection.type;
    await workflow.setDamageRolls(workflow.damageRolls);
    if (selection.animation2) {
        await new Sequence()
            .effect()
                .atLocation(source)
                .stretchTo(target)
                .file(selection.animation)
                .missed(!workflow.hitTargets.size)
                .waitUntilFinished(selection.delay)
                .name('chaosBolt-' + target.id)
            .effect()
                .atLocation('chaosBolt-' + target.id)
                .file(selection.animation2)
                .waitUntilFinished(selection.delay2)
            .play();
    } else {
        await new Sequence()
            .effect()
                .atLocation(source)
                .stretchTo(target)
                .file(selection.animation)
                .missed(!workflow.hitTargets.size)
                .waitUntilFinished(selection.delay)
            .play();
    }
    ignoreList.push(workflow.targets.first().document.uuid);
    if ((dice1 === dice2 && workflow.hitTargets.size) || alwaysBounce) {
        let nearbyTargets = await chris.findNearby(workflow.targets.first(), 30, 'ally', true, false).filter(i => !ignoreList.includes(i.document.uuid));
        if (nearbyTargets.length) {
            let targetSelect = await chris.selectTarget(workflow.item.name, constants.okCancel, nearbyTargets, true, 'one', null, false, 'Select a target for the attack to bounce to:');
            if (targetSelect.buttons) {
                await async function runFeature() {
                    let targetUuid = targetSelect.inputs.find(i => i);
                    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Chaos Bolt - Bounce', false);
                    if (!featureData) return;
                    delete featureData._id;
                    setProperty(featureData, 'flags.chris-premades.spell.chaosBolt', {
                        'ignoreList': ignoreList,
                        'targetUuid': target.document.uuid,
                        'uuid': randomID(),
                        'castLevel': castLevel,
                        'alwaysBounce': alwaysBounce
                    });
                    featureData.system.damage.parts[1][0] = castLevel + 'd6';
                    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
                    let [config, options] = constants.syntheticItemWorkflowOptions([targetUuid]);
                    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Chaos Bolt - Bounce');
                    await warpgate.wait(100);
                    await MidiQOL.completeItemUse(feature, config, options);
                }();
            }
        }
    }
    queue.remove(uuid);
}