import {dialogUtils, effectUtils, genericUtils, itemUtils, regionUtils, templateUtils} from '../../utils.js';
async function early({trigger, workflow}) {
    let concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let regions;
    let shape = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Shape', [['REGION.SHAPES.circle', 'circle'], ['DND5E.TargetLine', 'line']], {displayAsRows: true});
    if (!shape) return;
    if (shape === 'circle') {
        let radius = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Diameter', [['20 ft.', 10], ['15 ft.', 7.5], ['10 ft.', 5], ['5 ft.', 2.5]], {displayAsRows: true});
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
        await genericUtils.sleep(100);
        let facing = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.CircleFacing', [['CHRISPREMADES.Macros.WallOfFire.Inward', 'inward'], ['CHRISPREMADES.Macros.WallOfFire.Outward', 'outward']], {displayAsRows: true});
        if (!facing) {
            await genericUtils.remove(template);
            return;
        }
        let height = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Height', [['20 ft.', 20], ['15 ft.', 15], ['10 ft.', 10], ['5 ft.', 5]], {displayAsRows: true});
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
                    region: {
                        visibility: {
                            obscured: true
                        }
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
                },
                {
                    type: 'ellipse',
                    x: template.x,
                    y: template.y,
                    radiusX: (template.object.shape.radius / radius) * (radius - 2.5),
                    radiusY: (template.object.shape.radius / radius) * (radius - 2.5),
                    rotation: 0,
                    hole: true
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
                    }
                }
            }
        };
        effectUtils.addMacro(visionRegionData, 'region', ['wallOfFireVisionRegion']);
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
    } else {
        let length = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Length', [['60 ft.', 60], ['55 ft.', 55], ['50 ft.', 50], ['45 ft.', 45], ['40 ft.', 40], ['35 ft.', 35], ['30 ft.', 30], ['25 ft.', 25], ['20 ft.', 20], ['15 ft.', 15], ['10 ft.', 10], ['5 ft.', 5]], {displayAsRows: true});
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
        await genericUtils.sleep(100);
        let height = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Height', [['20 ft.', 20], ['15 ft.', 15], ['10 ft.', 10], ['5 ft.', 5]], {displayAsRows: true});
        if (!height) {
            await genericUtils.remove(template);
            return;
        }
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
                    }
                }
            }
        };
        effectUtils.addMacro(regionData, 'region', ['wallOfFireRegion']);
        console.log(template);
        let angle = Math.toDegrees(template.object.ray.angle);
        if (angle < 0) angle = 360 + angle;
        console.log(angle);
        let direction;
        if ((angle >= 135 && angle <= 225) || (angle >= 315 && angle < 360) || (angle >= 0 && angle <= 45)) {
            direction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Side', [['Up', 'up'], ['Down', 'down']]);
        } else {
            direction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WallOfFire.Side', [['Left', 'left'], ['Right', 'right']]);
        }
        if (!direction) {
            await genericUtils.remove(template);
            return;
        }
        //Finish this, ray stuff here
        //await regionUtils.createRegions([regionData], workflow.token.scene, {parentEntity: concentration});
        //await genericUtils.remove(template);
    }
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
    }
};
export let wallOfFireRegion = {
    name: 'Wall of Fire Region',
    version: wallOfFire.version
};