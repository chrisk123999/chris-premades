import {animationUtils, regionUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption, persistName, pickFile} from './spellParts.mjs';
/**
 * Stretch a looping wall asset along every segment of a wall, persisting until the region is deleted.
 * @param {Sequence} sequence Sequence to add to.
 * @param {object} region Wall region the effects are tied to.
 * @param {object} path Drawn wall path.
 * @param {string} file Asset stretched along each segment.
 * @param {object} [options]
 * @param {string} options.prefix Persist name prefix.
 * @param {number} [options.scale] Height of the strip as a multiple of its natural height.
 * @param {boolean} [options.belowTokens] Draw under tokens.
 * @param {number} [options.opacity] Effect opacity.
 */
export function addStrips(sequence, region, path, file, {prefix, scale = 1, belowTokens = false, opacity = 1}) {
    const grid = region.parent.grid.size;
    regionUtils.pathSegments(path).forEach(([start, end]) => {
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        if (!length) return;
        const overlap = Math.min(grid * 0.1, length / 4);
        const ux = (end.x - start.x) / length;
        const uy = (end.y - start.y) / length;
        /* eslint-disable indent */
        sequence
            .effect()
                .name(persistName(prefix, region))
                .file(file)
                .atLocation({x: start.x - ux * overlap, y: start.y - uy * overlap})
                .stretchTo({x: end.x + ux * overlap, y: end.y + uy * overlap}, {onlyX: true})
                .scale({x: 1, y: scale})
                .opacity(opacity)
                .belowTokens(belowTokens)
                .fadeIn(500)
                .fadeOut(1000)
                .persist()
                .tieToDocuments(region);
        /* eslint-enable indent */
    });
}
/**
 * Fill a region with a looping asset, masked to the region's shape and persisting until it is deleted.
 * @param {Sequence} sequence Sequence to add to.
 * @param {object} region Region to fill.
 * @param {string} file Asset to fill with.
 * @param {object} [options]
 * @param {string} options.prefix Persist name prefix.
 * @param {number} [options.opacity] Effect opacity.
 * @param {boolean} [options.belowTokens] Draw under tokens.
 * @param {number} [options.fadeIn] Fade-in time in milliseconds.
 * @param {number} [options.zIndex] Draw order among effects.
 */
export function addFill(sequence, region, file, {prefix, opacity = 1, belowTokens = true, fadeIn = 1000, zIndex = 0}) {
    const {x, y, width, height} = region.bounds;
    /* eslint-disable indent */
    sequence
        .effect()
            .name(persistName(prefix, region))
            .file(file)
            .atLocation({x: x + width / 2, y: y + height / 2})
            .size({width, height})
            .mask(region)
            .opacity(opacity)
            .belowTokens(belowTokens)
            .zIndex(zIndex)
            .fadeIn(fadeIn)
            .fadeOut(1000)
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
}
/**
 * Move a region's persisted fill to the region's current bounds.
 * @param {object} region Region the fill is tied to.
 * @param {string} prefix Name prefix the fill was added with.
 * @returns {Promise<boolean>} False when the region has no fill to move.
 */
export async function moveFill(region, prefix) {
    const [effect] = Sequencer.EffectManager.getEffects({name: persistName(prefix, region)});
    if (!effect) return false;
    const {x, y, width, height} = region.bounds;
    await effect.update({source: {...effect.data.source, x: x + width / 2, y: y + height / 2}, size: {...effect.data.size, width, height}});
    return true;
}
/**
 * Repeat a looping square asset at even spacing along a wall's whole path
 * @param {Sequence} sequence Sequence to add to.
 * @param {object} region Wall region the effects are tied to.
 * @param {object} path Drawn wall path.
 * @param {string} file Asset repeated along the path.
 * @param {string} prefix Persist name prefix.
 */
export function addTiles(sequence, region, path, file, prefix) {
    const tile = region.parent.grid.size * 1.5;
    const spacing = tile * 0.4;
    const points = [];
    let travelled = 0;
    let next = 0;
    for (const [start, end] of regionUtils.pathSegments(path)) {
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        for (; next <= travelled + length; next += spacing) {
            const fraction = length ? (next - travelled) / length : 0;
            points.push({x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction});
        }
        travelled += length;
    }
    points.forEach(point => {
        /* eslint-disable indent */
        sequence
            .effect()
                .name(persistName(prefix, region))
                .file(file)
                .atLocation(point)
                .size(tile)
                .randomRotation()
                .mask(region)
                .belowTokens()
                .fadeIn(500)
                .fadeOut(1000)
                .persist()
                .tieToDocuments(region);
        /* eslint-enable indent */
    });
}
/**
 * Place a looping dome or globe asset over a ring wall, persisting until the region is deleted.
 * @param {Sequence} sequence Sequence to add to.
 * @param {object} region Wall region the effect is tied to.
 * @param {{x: number, y: number, radius: number}} ring Ring centre and radius in canvas pixels.
 * @param {string} file Asset to place.
 * @param {object} [options]
 * @param {string} options.prefix Persist name prefix.
 * @param {number} [options.scale] Size as a multiple of the ring diameter.
 * @param {number} [options.opacity] Effect opacity.
 */
export function addDome(sequence, region, ring, file, {prefix, scale = 1.1, opacity = 1}) {
    /* eslint-disable indent */
    sequence
        .effect()
            .name(persistName(prefix, region))
            .file(file)
            .atLocation({x: ring.x, y: ring.y})
            .size(ring.radius * 2 * scale)
            .opacity(opacity)
            .fadeIn(500)
            .fadeOut(1000)
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
}
/**
 * Play a one-shot asset along each segment of a wall, staggered from start to end.
 * @param {Sequence} sequence Sequence to add to.
 * @param {object} region Wall region, for the grid size.
 * @param {object} path Drawn wall path.
 * @param {string} file Asset played at each step.
 * @param {object} [options]
 * @param {number} [options.size] Effect size in grid units.
 * @param {number} [options.step] Delay between steps in milliseconds.
 */
export function addBurst(sequence, region, path, file, {size = 2, step = 40} = {}) {
    const grid = region.parent.grid.size;
    regionUtils.pathSegments(path).forEach(([start, end]) => {
        const steps = Math.max(1, Math.round(Math.hypot(end.x - start.x, end.y - start.y) / grid));
        for (let index = 0; index <= steps; index++) {
            /* eslint-disable indent */
            sequence
                .effect()
                    .file(file)
                    .atLocation({x: start.x + (end.x - start.x) * index / steps, y: start.y + (end.y - start.y) * index / steps})
                    .size(size, {gridUnits: true})
                    .delay(index * step)
                    .randomRotation()
                    .zIndex(1);
            /* eslint-enable indent */
        }
    });
}
/**
 * Where a wall's cast animation points: the ring centre, the first point of the path or the centre of the first flat panel.
 * @param {object} path Drawn wall path.
 * @returns {{x: number, y: number}|undefined}
 */
export function castPoint(path) {
    if (path.ring) return {x: path.ring.x, y: path.ring.y};
    const segment = regionUtils.pathSegments(path)[0];
    if (segment) return segment[0];
    const flat = path.flats?.[0];
    return flat ? {x: flat.x + flat.size / 2, y: flat.y + flat.size / 2} : undefined;
}
/** Asset sets for each wall style, keyed by the style option. */
const wallStyles = {
    wallOfSand: {
        castColor: 'orange',
        fills: ['jb2a.sleet_storm.01.yellow', 'jb2a.sleet_storm.yellow'],
        fillOptions: {opacity: 0.9, belowTokens: false}
    },
    wallOfWater: {
        castColor: 'blue',
        strips: ['jb2a.energy_wall.01.25x05ft.01.loop.blue', 'jb2a.wall_of_force.horizontal.blue'],
        domes: ['jb2a.energy_wall.01.circle.500x500.01.loop.blue'],
        stripOptions: {scale: 0.8}
    },
    wallOfSnow: {
        castColor: 'grey',
        strips: ['jb2a.ice_spikes.wall.loop.white', 'jb2a.ice_spikes.wall.loop.blue'],
        domes: ['jb2a.ice_spikes.radial.loop.white'],
        stripOptions: {scale: 0.35}
    },
    wallOfDeath: {
        castColor: 'dark_purple',
        strips: ['jb2a.energy_wall.01.25x05ft.01.loop.purple', 'jb2a.wall_of_force.horizontal.purple'],
        domes: ['jb2a.energy_wall.01.circle.500x500.01.loop.purple'],
        stripOptions: {scale: 0.8}
    },
    wallOfForce: {
        castColor: 'blue',
        strips: ['jb2a.wall_of_force.horizontal.blue'],
        domes: ['jb2a.wall_of_force.sphere.blue'],
        stripOptions: {scale: 0.5, opacity: 0.6}
    },
    wallOfLight: {
        castColor: 'yellow',
        strips: ['jb2a.wall_of_force.horizontal.yellow', 'jb2a.energy_wall.01.25x05ft.01.loop.orange'],
        stripOptions: {scale: 1.5}
    },
    wallOfStone: {
        castColor: 'grey',
        bursts: ['jb2a.falling_rocks.top.2x1.grey'],
        strips: ['jb2a.falling_rocks.endframe.top.2x1.grey'],
        stripOptions: {scale: 0.3}
    },
    wallOfIce: {
        castColor: 'blue',
        strips: ['jb2a.ice_spikes.wall.loop.blue'],
        domes: ['jb2a.ice_spikes.radial.loop.blue'],
        stripOptions: {scale: 0.35}
    },
    wallOfThorns: {
        castColor: 'green',
        tiles: ['jb2a.entangle.02.loop.02.green', 'jb2a.entangle.green']
    },
    wallOfGloom: {
        castColor: 'dark_purple',
        strips: ['jb2a.wall_of_force.horizontal.grey'],
        fills: ['jb2a.sleet_storm.01.grey', 'jb2a.sleet_storm.grey'],
        stripOptions: {scale: 1.2},
        fillOptions: {opacity: 0.7, belowTokens: false}
    },
    windWall: {
        castColor: 'grey',
        strips: ['jb2a.wind_wall.300x100', 'jb2a.wind_wall.200x100', 'jb2a.wind_wall.100x100'],
        stripOptions: {scale: 0.6, opacity: 0.85}
    }
};
function addWall(sequence, region, path, flats, {strips = [], domes = [], fills = [], tiles = [], stripOptions = {}, fillOptions = {}}) {
    const prefix = 'wall';
    const dome = path.ring && pickFile(...domes);
    const strip = pickFile(...strips);
    const fill = pickFile(...fills);
    const tile = pickFile(...tiles);
    if (dome) addDome(sequence, region, path.ring, dome, {prefix});
    else if (strip) addStrips(sequence, region, path, strip, {prefix, ...stripOptions});
    if (tile) addTiles(sequence, region, path, tile, prefix);
    if (fill) addFill(sequence, region, fill, {prefix, ...fillOptions});
    const flatFile = fill ?? strip ?? tile;
    if (flatFile) flats.forEach(flat => addFill(sequence, flat, flatFile, {prefix, opacity: 0.6, belowTokens: false}));
}
async function play(sourceToken, region, {style = 'wallOfForce', cast = true, path, flats = []} = {}) {
    if (!region || !path) return;
    const parts = wallStyles[style] ?? wallStyles.wallOfForce;
    const sequence = new Sequence();
    const point = castPoint(path);
    if (cast && sourceToken && point) addCast(sequence, sourceToken, point, {file: getPalette(casts, parts.castColor), wait: -750});
    const burst = pickFile(...(parts.bursts ?? []));
    if (burst) addBurst(sequence, region, path, burst);
    addWall(sequence, region, path, flats, parts);
    await sequence.play();
}
async function reshape(region, {style = 'wallOfForce', path} = {}) {
    await Sequencer.EffectManager.endEffects({name: persistName('wall', region)});
    const sequence = new Sequence();
    addWall(sequence, region, path, [], wallStyles[style] ?? wallStyles.wallOfForce);
    await sequence.play();
}
/** Wall spell animation */
export const wall = {
    name: 'CHRISPREMADES.Animations.Wall',
    macros: {play, reshape},
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    config: {
        style: {
            default: 'wallOfForce',
            type: 'select',
            label: 'CHRISPREMADES.Animations.SpellParts.Style',
            options: Object.fromEntries(Object.keys(wallStyles).map(style => [style, {label: 'CHRISPREMADES.Animations.' + style.capitalize()}]))
        },
        cast: partOption('Cast')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
