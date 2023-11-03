import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let templateData = {
        't': 'circle',
        'user': game.user,
        'distance': workflow.castData.castLevel * 20,
        'direction': 0,
        'fillColor': game.user.color,
        'flags': {
            'dnd5e': {
                'origin': workflow.item.uuid
            },
            'midi-qol': {
                'originUuid': workflow.item.uuid
            },
            'chris-premades': {
                'spell': {
                    'fogCloud': true
                }
            },
            'limits': {
                'sight': {
                    'basicSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'devilsSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'lightPerception': {
                        'enabled': true,
                        'range': 0
                    },
                    'seeAll': {
                        'enabled': true,
                        'range': 0
                    },
                },
            },
            'walledtemplates': {
                'wallRestriction': 'move',
                'wallsBlock': 'recurse',
            },
        },
        'angle': 0
    };
    await workflow.actor.sheet.minimize();
    let template = await chris.placeTemplate(templateData);
    await workflow.actor.sheet.maximize();
    if (!template) return;
    let xray = game.settings.get('chris-premades', 'Show Limits Animations');
    let path = 'jb2a.fog_cloud.01.white';
    if (game.modules.get('jb2a_patreon')?.active) {
        if (isNewerVersion('0.6.1', game.modules.get('jb2a_patreon').version)) path = 'jb2a.fog_cloud.1.white';
    }
    if (game.modules.get('walledtemplates')) {
        new Sequence().effect().file(path).scaleToObject().aboveLighting().opacity(0.5).mask(template).xray(xray).persist(true).attachTo(template).play();
    } else {
        new Sequence().effect().file(path).scaleToObject().aboveLighting().opacity(0.5).xray(xray).persist(true).attachTo(template).play();
    }
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'mode': 5,
                'priority': 20,
                'value': template.uuid
            }
        ],
        'duration': {
            'seconds': chris.itemDuration(workflow.item).seconds
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
async function hook(workflow) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first().document;
    if (!targetToken) return;
    let sourceToken = workflow.token.document;
    let sourceTemplates = game.modules.get('templatemacro').api.findContainers(sourceToken);
    let sourceInFogCloud = false;
    for (let i = 0; sourceTemplates.length > i; i++) {
        let testTemplate = canvas.scene.collections.templates.get(sourceTemplates[i]);
        if (!testTemplate) continue;
        let fogCloud = testTemplate.flags['chris-premades']?.spell?.fogCloud;
        if (fogCloud) {
            sourceInFogCloud = true;
            break;
        }
    }
    let targetInFogCloud = false;
    let targetTemplates = game.modules.get('templatemacro').api.findContainers(targetToken);
    for (let i = 0; targetTemplates.length > i; i++) {
        let testTemplate = canvas.scene.collections.templates.get(targetTemplates[i]);
        if (!testTemplate) continue;
        let darkness = testTemplate.flags['chris-premades']?.spell?.fogCloud;
        if (darkness) {
            targetInFogCloud = true;
            break;
        }
    }
    if (!sourceInFogCloud && !targetInFogCloud) return;
    let distance = chris.getDistance(sourceToken, targetToken);
    let sourceCanSeeTarget = false;
    let targetCanSeeSource = false;
    let sourceSenses = sourceToken.actor.system.attributes.senses;
    let targetSenses = targetToken.actor.system.attributes.senses;
    if ((sourceSenses.tremorsense >= distance) || (sourceSenses.blindsight >= distance)) sourceCanSeeTarget = true;
    if ((targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance)) targetCanSeeSource = true;
    if (sourceCanSeeTarget && targetCanSeeSource) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fogCloud', 50);
    if (!queueSetup) return;
    if (sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.attackAdvAttribution.add('Fog Cloud: Target Can\'t See Source');
    }
    if (!sourceCanSeeTarget && targetCanSeeSource) {
        workflow.disadvantage = true;
        workflow.flankingAdvantage = false;
        workflow.attackAdvAttribution.add('Fog Cloud: Source Can\'t See Target');
    }
    if (!sourceCanSeeTarget && !targetCanSeeSource) {
        workflow.advantage = true;
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('Fog Cloud: Target And Source Can\'t See Eachother');
    }
    queue.remove(workflow.item.uuid);
}
export let fogCloud = {
    'item': item,
    'hook': hook
}