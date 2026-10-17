import {animationUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption, persistName, pickFile} from '../generic/spellParts.mjs';
import {addDome, addStrips, castPoint} from '../generic/wallParts.mjs';
const prismaticColors = {red: 'red', orange: 'orange', yellow: 'yellow', green: 'green', blue: 'blue', indigo: 'purple', violet: 'purple'};
function layerPrefix(layer) {
    return `prismaticWall-${layer}`;
}
async function playPrismatic(sourceToken, region, {cast = true, path} = {}) {
    if (!region || !path) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, castPoint(path), {file: getPalette(casts, 'pink'), wait: -750});
    const layers = region.flags['chris-premades']?.prismaticLayers ?? Object.keys(prismaticColors);
    layers.forEach((layer, index) => {
        const color = prismaticColors[layer];
        if (path.ring) {
            const sphere = pickFile(`jb2a.wall_of_force.sphere.${color}`);
            if (sphere) addDome(sequence, region, {...path.ring, radius: path.ring.radius * (1 - index * 0.03)}, sphere, {prefix: layerPrefix(layer), opacity: 0.45});
        } else {
            const strip = pickFile(`jb2a.wall_of_force.horizontal.${color}`);
            if (strip) addStrips(sequence, region, path, strip, {prefix: layerPrefix(layer), scale: 0.35 + index * 0.08, opacity: 0.45});
        }
    });
    await sequence.play();
}
async function destroyLayer(region, layer) {
    await Sequencer.EffectManager.endEffects({name: persistName(layerPrefix(layer), region)});
}
export const prismaticWall = {
    name: 'CHRISPREMADES.Animations.PrismaticWall',
    macros: {
        play: playPrismatic,
        destroyLayer
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
