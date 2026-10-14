import {regionUtils} from '../../../proxy.mjs';
import {addCast, addImpact, casts, colorOption, getColor, getPalette, partOption} from './spellParts.mjs';
const colorMap = {
    orange: 'Orange',
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    yellow: 'Yellow',
    red: 'Red',
    dark_purple: 'DarkPurple',
    pink: 'Pink'
};
const palettes = {
    cone: {
        patreon: {
            orange: 'jb2a.breath_weapons.fire.cone.orange.01',
            blue: 'jb2a.breath_weapons.cold.cone.blue',
            green: 'jb2a.breath_weapons.poison.cone.green',
            purple: 'jb2a.breath_weapons.fire.cone.purple.01',
            yellow: 'jb2a.breath_weapons.fire.cone.yellow.01',
            red: 'jb2a.breath_weapons.poison.cone.red',
            dark_purple: 'jb2a.breath_weapons02.burst.cone.arcana.dark_black.01'
        },
        free: {
            orange: 'jb2a.breath_weapons.fire.cone.orange.01',
            blue: 'jb2a.breath_weapons.cold.cone.blue',
            green: 'jb2a.breath_weapons.poison.cone.green'
        }
    },
    line: {
        patreon: {
            orange: 'jb2a.breath_weapons.fire.line.orange',
            blue: 'jb2a.breath_weapons.lightning.line.blue',
            green: 'jb2a.breath_weapons.acid.line.green',
            purple: 'jb2a.breath_weapons.fire.line.purple',
            yellow: 'jb2a.breath_weapons02.burst.line.holy.yellow.01',
            dark_purple: 'jb2a.breath_weapons02.burst.line.arcana.dark_black.01'
        },
        free: {
            orange: 'jb2a.breath_weapons.fire.line.orange',
            blue: 'jb2a.breath_weapons.lightning.line.blue',
            green: 'jb2a.breath_weapons.acid.line.green'
        }
    },
    circle: {
        patreon: {
            orange: 'jb2a.explosion.01.orange',
            blue: 'jb2a.explosion.02.blue',
            green: 'jb2a.explosion.01.green',
            purple: 'jb2a.explosion.01.purple',
            yellow: 'jb2a.explosion.01.yellow',
            red: 'jb2a.explosion.04.dark_red',
            dark_purple: 'jb2a.explosion.04.dark_purple',
            pink: 'jb2a.explosion.03.pink'
        },
        free: {
            orange: 'jb2a.explosion.01.orange',
            blue: 'jb2a.explosion.02.blue',
            yellow: 'jb2a.explosion.03.blueyellow'
        }
    },
    square: {
        patreon: {
            blue: 'jb2a.thunderwave.center.blue',
            green: 'jb2a.thunderwave.center.green',
            orange: 'jb2a.thunderwave.center.orange',
            red: 'jb2a.thunderwave.center.dark_red',
            dark_purple: 'jb2a.thunderwave.center.dark_purple'
        },
        free: {
            blue: 'jb2a.thunderwave.center.blue'
        }
    },
    persist: {
        patreon: {
            blue: 'jb2a.template_circle.aura.01.loop.large.bluepurple',
            green: 'jb2a.template_circle.aura.01.loop.large.green',
            orange: 'jb2a.template_circle.aura.01.loop.large.orangepurple',
            yellow: 'jb2a.template_circle.aura.01.loop.large.yellow'
        },
        free: {
            blue: 'jb2a.template_circle.aura.01.loop.large.bluepurple'
        }
    }
};
export function getAreaGeometry(sourceToken, region, {radius = 0} = {}) {
    const shape = region?.shapes[0];
    if (shape?.type === 'cone' || shape?.type === 'line') {
        const size = shape.type === 'cone' ? shape.radius : shape.length;
        const angle = Math.toRadians(shape.rotation);
        const origin = {x: shape.x, y: shape.y};
        const end = {x: origin.x + (Math.cos(angle) * size), y: origin.y + (Math.sin(angle) * size)};
        return {type: shape.type, origin, center: {x: (origin.x + end.x) / 2, y: (origin.y + end.y) / 2}, end, size, rotation: shape.rotation};
    }
    if (region) {
        const area = regionUtils.getArea(region);
        const center = {x: area.x, y: area.y};
        if (shape?.type === 'rectangle') return {type: 'square', origin: center, center, size: shape.width, rotation: shape.rotation};
        return {type: 'circle', origin: center, center, size: area.radius * 2, rotation: 0};
    }
    const scene = sourceToken.parent;
    const center = sourceToken.getCenterPoint();
    const size = (radius * scene.grid.size / scene.grid.distance * 2) + (sourceToken.width * scene.grid.size);
    return {type: 'circle', origin: center, center, size, rotation: 0};
}
function addArea(sequence, geometry, file) {
    const section = sequence.effect().file(file).zIndex(1);
    if (geometry.end) section.atLocation(geometry.origin).stretchTo(geometry.end);
    else section.atLocation(geometry.center).size(geometry.size).rotate(-geometry.rotation);
}
function addPersist(sequence, region, geometry, file) {
    const section = sequence.effect().name('castArea ' + region.uuid).file(file);
    if (region.attachment?.token) section.attachTo(region.attachment.token);
    else section.atLocation(geometry.center);
    /* eslint-disable indent */
    section
        .size(geometry.end ? geometry.size * 2 : geometry.size * Math.SQRT2)
        .mask(region)
        .belowTokens()
        .opacity(0.6)
        .fadeIn(1000)
        .fadeOut(1000)
        .persist()
        .tieToDocuments(region);
    /* eslint-enable indent */
}
async function play(sourceToken, region, {color = 'auto', cast = true, impact = true, persist = false, damageType, targets = [], radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    color = getColor(color, damageType);
    const file = getPalette(palettes[geometry.type], color);
    if (!file) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: getPalette(casts, color), wait: -750});
    addArea(sequence, geometry, file);
    if (impact) {
        sequence.wait(500);
        targets.filter(target => target.saved === false || target.hit === true).forEach(target => addImpact(sequence, target.token, color));
    }
    if (persist && region) addPersist(sequence, region, geometry, getPalette(palettes.persist, color));
    await sequence.play();
}
export const castArea = {
    name: 'CHRISPREMADES.Animations.CastArea',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            color: colorOption(colorMap, ['orange', 'blue', 'green']),
            cast: partOption('Cast'),
            impact: partOption('Impact'),
            persist: partOption('Persist', {defaultValue: false})
        };
    }
};
