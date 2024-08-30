import {Crosshairs} from '../crosshairs.js';
import {genericUtils} from './genericUtils.js';

async function aimCrosshair({token, maxRange, crosshairsConfig, centerpoint, drawBoundries, customCallbacks, trackDistance=true, fudgeDistance=0}) {
    let distance = 0;
    let widthAdjust = 0;
    if (!centerpoint) {
        let actualHalf = token.document.width / 2;
        widthAdjust += canvas.grid.distance * Math.floor(actualHalf);
        if (!fudgeDistance && (widthAdjust !== actualHalf * canvas.grid.distance)) {
            fudgeDistance = 2.5;
        }
        fudgeDistance += widthAdjust;
    }
    centerpoint = centerpoint ?? token.center;
    let drawing;
    let container;
    let checkDistance = async (crosshairs) => {
        if (maxRange && drawBoundries) {
            let radius = (canvas.grid.size * ((maxRange + fudgeDistance + widthAdjust) / canvas.grid.distance));
            drawing = new PIXI.Graphics();
            drawing.lineStyle(5, 0xffffff);
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
                if (token.checkCollision(crosshairs, {origin: token.center, type: 'move', mode: 'any'}) || distance > maxRange) {
                    crosshairs.icon = 'icons/svg/hazard.svg';
                    if (drawing) drawing.tint = 0xff0000;
                } else {
                    crosshairs.icon = crosshairsConfig?.icon;
                    if (drawing) drawing.tint = 0x32cd32;
                }
                crosshairs.draw();
                crosshairs.label = distance + '/' + maxRange + 'ft.';
            }
        }
    };
    let callbacks = {
        show: checkDistance,
        ...(customCallbacks ?? {})
    };
    let options = {};
    if (trackDistance) options.label = '0ft';
    options = {
        ...options,
        ...crosshairsConfig
    };
    if (!maxRange) return await Crosshairs.showCrosshairs(options);
    let result = await Crosshairs.showCrosshairs(options, callbacks);
    if (drawing) {
        drawing.destroy();
        container.destroy();
    }
    return result;
}
export let crosshairUtils = {
    aimCrosshair
};