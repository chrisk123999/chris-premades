import {Crosshairs} from '../crosshairs.js';
import {genericUtils} from './genericUtils.js';

async function aimCrosshair({token, maxRange, crosshairsConfig, centerpoint, drawBoundries, customCallbacks, trackDistance = true, fudgeDistance = 0, validityFunctions = []}) {
    let distance = 0;
    let widthAdjust = 0;
    if (maxRange) maxRange = genericUtils.handleMetric(Number(maxRange));
    if (!centerpoint) {
        let actualHalf = token.document.width / 2;
        widthAdjust += canvas.grid.distance * Math.floor(actualHalf);
        if (!fudgeDistance && (widthAdjust !== actualHalf * canvas.grid.distance)) {
            fudgeDistance = genericUtils.handleMetric(2.5);
        }
        fudgeDistance += widthAdjust;
    }
    centerpoint = centerpoint ?? token.center;
    let drawing;
    let container;
    let valid = true;
    let checkDistance = async (crosshairs) => {
        if (maxRange && drawBoundries) {
            let radius = (canvas.grid.size * ((maxRange + fudgeDistance + widthAdjust) / canvas.grid.distance));
            drawing = new PIXI.Graphics();
            drawing.lineStyle(genericUtils.handleMetric(5), 0xffffff);
            let matchTemplates = game.settings.get('core', 'gridTemplates') && (game.settings.get('core', 'gridDiagonals') !== CONST.GRID_DIAGONALS.EXACT);
            if (matchTemplates) {
                drawing.drawPolygon(canvas.grid.getCircle(centerpoint, maxRange + fudgeDistance + widthAdjust));
            } else {
                drawing.drawCircle(centerpoint.x, centerpoint.y, radius);
            }
            drawing.tint = 0x32cd32;
            container = new PIXI.Container();
            container.addChild(drawing);
            canvas.drawings.addChild(container);
        }
        while (crosshairs.inFlight) {
            await genericUtils.sleep(100);
            if (trackDistance) {
                distance = canvas.grid.measurePath([centerpoint, crosshairs]).distance.toNearest(0.01);
                distance = Math.max(0, distance - widthAdjust);
                // Below checks if token can see place wants to move thing to - sort of
                if (token.checkCollision(crosshairs, {origin: token.center, type: 'move', mode: 'any'}) || distance > maxRange || validityFunctions.some(i => !i(crosshairs))) {
                    crosshairs.icon = 'icons/svg/hazard.svg';
                    if (drawing) drawing.tint = 0xff0000;
                    valid = false;
                } else {
                    crosshairs.icon = crosshairsConfig?.icon;
                    if (drawing) drawing.tint = 0x32cd32;
                    valid = true;
                }
                crosshairs.draw();
                let mesureUnit = genericUtils.getCPRSetting('metricSystem') ? ' m' : 'ft.';
                crosshairs.label = distance + '/' + maxRange + mesureUnit;
            }
        }
    };
    let callbacks = {
        show: checkDistance,
        ...(customCallbacks ?? {})
    };
    let options = {};
    if (trackDistance) options.label = genericUtils.getCPRSetting('metricSystem') ? '0 m' : '0ft';
    options = {
        ...options,
        ...crosshairsConfig
    };
    if (token?.document.rotation) options.direction = token.document.rotation;
    if (!maxRange) return await Crosshairs.showCrosshairs(options);
    let result = await Crosshairs.showCrosshairs(options, callbacks);
    if (drawing) {
        drawing.destroy();
        container.destroy();
    }
    return {...result, valid};
}
export let crosshairUtils = {
    aimCrosshair
};