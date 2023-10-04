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
                    'blindsight': {
                        'enabled': true,
                        'range': 0
                    },
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
    let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {'parent': canvas.scene});
    let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
    let[finalTemplate] = await template.drawPreview();
    let xray = game.settings.get('chris-premades', 'See Limits Animations');
    new Sequence().effect().file('jb2a.fog_cloud.1.white').scale(workflow.castData.castLevel).aboveLighting().opacity(0.5).xray(xray).persist(true).attachTo(finalTemplate).play();
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'mode': 5,
                'priority': 20,
                'value': finalTemplate.uuid
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