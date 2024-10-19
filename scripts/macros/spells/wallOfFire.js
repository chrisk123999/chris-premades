import {combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, regionUtils, templateUtils, workflowUtils} from '../../utils.js';
async function early({trigger, workflow}) {
    let concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let shape = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Shape', [['REGION.SHAPES.circle', 'circle'], ['DND5E.TargetLine', 'line']], {displayAsRows: true});
    if (!shape) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    if (sound === '') sound = undefined;
    let distance20Buttons = [20, 15, 10, 5].map(i => [genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: i}), i]);
    if (shape === 'circle') {
        let radius = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Diameter', distance20Buttons.map(i => [i[0], i[1] / 2]), {displayAsRows: true});
        if (!radius) return;
        radius = Number(radius);
        let templateData = {
            user: game.user,
            t: 'circle',
            distance: radius,
            direction: 0,
            angle: 0,
            width: 0,
            fillColor: game.user.color,
            flags: {
                dnd5e: {
                    origin: workflow.item.uuid
                }
            }
        };
        await workflow.actor.sheet.minimize();
        let template = await templateUtils.placeTemplate(templateData);
        await workflow.actor.sheet.maximize();
        await genericUtils.sleep(50);
        let facing = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.CircleFacing', [['CHRISPREMADES.Macros.WallOfFire.Inward', 'inward'], ['CHRISPREMADES.Macros.WallOfFire.Outward', 'outward']], {displayAsRows: true});
        if (!facing) {
            await genericUtils.remove(template);
            return;
        }
        let height = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Height', distance20Buttons, {displayAsRows: true});
        if (!height) return;
        let regionData = {
            name: workflow.item.name,
            color: game.user.color,
            shapes: [
                {
                    type: 'ellipse',
                    x: template.x,
                    y: template.y,
                    radiusX: (template.object.shape.radius / radius) * (radius - 0.5),
                    radiusY: (template.object.shape.radius / radius) * (radius - 0.5),
                    rotation: 0,
                    hole: false
                }
            ],
            elevation: {
                bottom: workflow.token.document.elevation,
                top: workflow.token.document.elevation + height
            },
            behaviors: [],
            visibility: 2,
            locked: false,
            flags: {
                'chris-premades': {
                    castData: {
                        castLevel: workflow.castData.castLevel,
                        baseLevel: workflow.castData.baseLevel,
                        saveDC: itemUtils.getSaveDC(workflow.item)
                    },
                    wallOfFire: {
                        casterUuid: workflow.actor.uuid
                    }
                }
            }
        };
        let visionRegionData = {
            name: workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Macros.WallOfFire.Flames'),
            color: game.user.color,
            shapes: [
                {
                    type: 'ellipse',
                    x: template.x,
                    y: template.y,
                    radiusX: (template.object.shape.radius / radius) * (radius + 2.5),
                    radiusY: (template.object.shape.radius / radius) * (radius + 2.5),
                    rotation: 0,
                    hole: false
                }
            ],
            elevation: {
                bottom: workflow.token.document.elevation,
                top: workflow.token.document.elevation + height
            },
            behaviors: [],
            visibility: 2,
            locked: false,
            flags: {
                'chris-premades': {
                    castData: {
                        castLevel: workflow.castData.castLevel,
                        baseLevel: workflow.castData.baseLevel,
                        saveDC: itemUtils.getSaveDC(workflow.item)
                    },
                    region: {
                        visibility: {
                            obscured: true
                        }
                    },
                    wallOfFire: {
                        casterUuid: workflow.actor.uuid
                    }
                }
            }
        };
        if (radius != 2.5) {
            visionRegionData.shapes.push({
                type: 'ellipse',
                x: template.x,
                y: template.y,
                radiusX: (template.object.shape.radius / radius) * (radius - 2.5),
                radiusY: (template.object.shape.radius / radius) * (radius - 2.5),
                rotation: 0,
                hole: true
            });
        }
        effectUtils.addMacro(visionRegionData, 'region', ['wallOfFireWallRegion']);
        effectUtils.addMacro(regionData, 'region', ['wallOfFireRegion']);
        if (facing === 'outward') {
            regionData.shapes.unshift({
                type: 'ellipse',
                x: template.x,
                y: template.y,
                radiusX: (template.object.shape.radius / radius) * (radius + 10.5),
                radiusY: (template.object.shape.radius / radius) * (radius + 10.5),
                hole: false
            });
            regionData.shapes[1].hole = true;
            
        } else {
            regionData.shapes[0].radiusX = (template.object.shape.radius / radius) * (radius + 0.5);
            regionData.shapes[0].radiusY = (template.object.shape.radius / radius) * (radius + 0.5);
        }
        let [visibilityRegion] = await regionUtils.createRegions([visionRegionData], workflow.token.scene, {parentEntity: concentration});
        genericUtils.updateTargets(visibilityRegion.tokens.map(i => i.object));
        await genericUtils.update(visibilityRegion, {
            shapes: [
                {
                    type: 'ellipse',
                    x: template.x,
                    y: template.y,
                    radiusX: (template.object.shape.radius / radius) * (radius + 0.5),
                    radiusY: (template.object.shape.radius / radius) * (radius + 0.5),
                    rotation: 0,
                    hole: false
                },
                {
                    type: 'ellipse',
                    x: template.x,
                    y: template.y,
                    radiusX: (template.object.shape.radius / radius) * (radius - 0.5),
                    radiusY: (template.object.shape.radius / radius) * (radius - 0.5),
                    rotation: 0,
                    hole: true
                }
            ]
        });
        await regionUtils.createRegions([regionData], workflow.token.scene, {parentEntity: concentration});
        await genericUtils.remove(template);
        if (playAnimation) {
            /* eslint-disable indent */
            new Sequence()
                .effect()
                    .file('jb2a.wall_of_fire.500x100.' + color)
                    .scaleToObject(1.05)
                    .attachTo(visibilityRegion, {offset: {x: visibilityRegion.object.center.x, y: visibilityRegion.object.center.y}})
                    .persist()
                    .name('wallOfFire')
                    .fadeIn(300)
                    .fadeOut(300)
                    .aboveInterface()
                .sound()
                    .playIf(sound)
                    .file(sound)
                .play();
            /* eslint-enable indent */
        }
    } else {
        // I didn't feel like writing [60, 55, 50...] so I did this
        let lengthButtons = Array.from(Array(12).keys().map(i => 5 * (i + 1))).toSorted((a, b) => b - a).map(i => [genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: i}), i]);
        let length = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Length', lengthButtons, {displayAsRows: true});
        if (!length) return;
        length = Number(length);
        let templateData = {
            user: game.user,
            t: 'ray',
            distance: length,
            direction: 0,
            angle: 0,
            width: 10,
            fillColor: game.user.color,
            flags: {
                dnd5e: {
                    origin: workflow.item.uuid
                }
            }
        };
        await workflow.actor.sheet.minimize();
        let template = await templateUtils.placeTemplate(templateData);
        await workflow.actor.sheet.maximize();
        await genericUtils.sleep(50);
        let height = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Height', distance20Buttons, {displayAsRows: true});
        if (!height) {
            await genericUtils.remove(template);
            return;
        }
        let angle = Math.toDegrees(template.object.ray.angle);
        if (angle < 0) angle = 360 + angle;
        let direction;
        if ((angle >= 135 && angle <= 225) || (angle >= 315 && angle < 360) || (angle >= 0 && angle <= 45)) {
            direction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Side', [['CHRISPREMADES.Direction.Up', 'up'], ['CHRISPREMADES.Direction.Down', 'down']]);
        } else {
            direction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Side', [['CHRISPREMADES.Direction.Left', 'left'], ['CHRISPREMADES.Direction.Right', 'right']]);
        }
        if (!direction) {
            await genericUtils.remove(template);
            return;
        }
        let smallDistance = (template.object.ray.distance / length) * 5;
        let shortAngle;
        if (angle >= 135 && angle <= 225) {
            if (direction === 'up') {
                shortAngle = -90;
            } else {
                shortAngle = 90;
            }
        } else if (angle > 225 && angle < 315) {
            if (direction === 'right') {
                shortAngle = -90;
            } else {
                shortAngle = 90;
            }
        } else if ((angle >= 315 && angle <= 359) || (angle >= 0 && angle <= 45)) {
            if (direction === 'up') {
                shortAngle = 90;
            } else {
                shortAngle = -90;
            }
        } else if (angle > 45 && angle <= 135) {
            if (direction === 'right') {
                shortAngle = 90;
            } else {
                shortAngle = -90;
            }
        }
        let shortRay = template.object.ray.shiftAngle(Math.toRadians(shortAngle), smallDistance);
        await genericUtils.update(template, {
            x: shortRay.B.x,
            y: shortRay.B.y,
            width: 2.5
        });
        await genericUtils.sleep(50);
        let visionRegionData = {
            name: workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Macros.WallOfFire.Flames'),
            color: game.user.color,
            shapes: [
                regionUtils.templateToRegionShape(template)
            ],
            elevation: {
                bottom: workflow.token.document.elevation,
                top: workflow.token.document.elevation + height
            },
            behaviors: [],
            visibility: 2,
            locked: false,
            flags: {
                'chris-premades': {
                    castData: {
                        castLevel: workflow.castData.castLevel,
                        baseLevel: workflow.castData.baseLevel,
                        saveDC: itemUtils.getSaveDC(workflow.item)
                    },
                    region: {
                        visibility: {
                            obscured: true
                        }
                    },
                    wallOfFire: {
                        casterUuid: workflow.actor.uuid
                    }
                }
            }
        };
        effectUtils.addMacro(visionRegionData, 'region', ['wallOfFireWallRegion']);
        let [visibilityRegion] = await regionUtils.createRegions([visionRegionData], workflow.token.scene, {parentEntity: concentration});
        let targets = Array.from(visibilityRegion.tokens);
        await genericUtils.update(template, {
            width: 1
        });
        await genericUtils.sleep(50);
        await genericUtils.update(visibilityRegion, {
            shapes: [
                regionUtils.templateToRegionShape(template)
            ]
        });
        if (playAnimation) {
            /* eslint-disable indent */
            new Sequence()
                .effect()
                    .file('jb2a.wall_of_fire.300x100.' + color)
                    .atLocation({x: template.object.ray.A.x, y: template.object.ray.A.y})
                    .stretchTo({x: template.object.ray.B.x, y: template.object.ray.B.y})
                    .scale({x: 1, y: (15 / length)})
                    .persist() //Not working???
                    .duration(Math.floor(Number.MAX_SAFE_INTEGER / 1000)) //See: https://github.com/fantasycalendar/FoundryVTT-Sequencer/issues/269
                    .name('wallOfFire')
                    .tieToDocuments(visibilityRegion)
                    .fadeIn(300)
                    .fadeOut(300)
                    .aboveInterface()
                .sound()
                    .playIf(sound)
                    .file(sound)
                .play();
            /* eslint-enable indent */
        }
        await genericUtils.update(template, {
            x: shortRay.A.x,
            y: shortRay.A.y,
            width: 11
        });
        await genericUtils.sleep(50);
        let regionData = {
            name: workflow.item.name,
            color: game.user.color,
            shapes: [
                regionUtils.templateToRegionShape(template)
            ],
            elevation: {
                bottom: workflow.token.document.elevation,
                top: workflow.token.document.elevation + height
            },
            behaviors: [],
            visibility: 2,
            locked: false,
            flags: {
                'chris-premades': {
                    castData: {
                        castLevel: workflow.castData.castLevel,
                        baseLevel: workflow.castData.baseLevel,
                        saveDC: itemUtils.getSaveDC(workflow.item)
                    },
                    wallOfFire: {
                        casterUuid: workflow.actor.uuid
                    }
                }
            }
        };
        effectUtils.addMacro(regionData, 'region', ['wallOfFireRegion']);
        await regionUtils.createRegions([regionData], workflow.token.scene, {parentEntity: concentration});
        await genericUtils.remove(template);
        genericUtils.updateTargets(targets);
    }
}
async function movement({trigger}) {
    await save(trigger, 'Movement');
}
async function endTurn({trigger}) {
    await save(trigger, 'End Turn');
}
async function save(trigger, type) {
    if (combatUtils.inCombat()) {
        let touchedTokens = trigger.entity.flags['chris-premades']?.wallOfFire?.touchedTokens?.[combatUtils.currentTurn()] ?? [];
        if (touchedTokens.includes(trigger.token.id)) return;
        touchedTokens.push(trigger.token.id);
        await genericUtils.setFlag(trigger.entity, 'chris-premades', 'wallOfFire.touchedTokens.' + combatUtils.currentTurn(), touchedTokens);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Wall of Fire: ' + type, {object: true, getDescription: true});
    if (!featureData) return;
    let castLevel = trigger.castData.castLevel;
    featureData.system.damage.parts[0][0] = (castLevel + 1) + 'd8[fire]';
    let casterUuid = trigger.entity.flags['chris-premades']?.wallOfFire?.casterUuid;
    if (!casterUuid) return;
    let actor = await fromUuid(casterUuid);
    if (!actor) return;
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [trigger.token], {killAnim: true});
}
async function endCombat({trigger}) {
    await genericUtils.setFlag(trigger.entity, 'chris-premades', 'wallOfFire.touchedTokens', null);
}
export let wallOfFire = {
    name: 'Wall of Fire',
    version: '1.0.17',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'yellow',
            category: 'animation',
            options: [
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow'
                },
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                }
            ]
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'sound'
        }
    ]
};
export let wallOfFireRegion = {
    name: 'Wall of Fire Region',
    version: wallOfFire.version,
    region: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        },
        {
            pass: 'combatEnd',
            macro: endCombat,
            priority: 50
        }
    ]
};
export let wallOfFireWallRegion = {
    name: 'Wall of Fire Wall Region',
    version: wallOfFire.version,
    region: [
        {
            pass: 'enter',
            macro: movement,
            priority: 50
        },
        {
            pass: 'passedThrough',
            macro: movement,
            priority: 50
        },
        {
            pass: 'combatEnd',
            macro: endCombat,
            priority: 50
        }
    ]
};