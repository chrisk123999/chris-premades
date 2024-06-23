// Crosshairs w/ preview texture being the token, text above with distance available via callbacks, error texture if outside of range
// changes, merge actor prototype token with token updates, create token document, update token delta with actor updates
// const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));
// tokenDocument.delta.updateSource(actorUpdates);
// eventually await canvas.scene.createEmbeddedDocuments

import {Crosshairs} from './crosshairs.js';
import {animationUtils} from './utilities/animationUtils.js';

export class Summons {
    constructor() {

    }
    static async spawn(sourceActor, updates = {}, summonerToken, options = {callbacks: undefined, range: 100, animation: 'default'}) {
        let tokenDocument = await sourceActor.getTokenDocument();
        let width = updates?.token?.width ?? tokenDocument.width;
        let spawnOptions = {};
        if (summonerToken?.actor) {
            spawnOptions = {
                'controllingActor': summonerToken.actor,
                'crosshairs': {
                    'interval': width % 2 === 0 ? 1 : -1
                }
            };
        }
        if (options.animation != 'none' && !options.callbacks.post) {
            let callbackFunction = animationUtils.summonEffects[options.animation];
            if (typeof callbackFunction === 'function' && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck()) {
                options.callbacks.post = callbackFunction;
                setProperty(updates, 'token.alpha', 0);
            }
        }
        if (!options.callbacks.show) {
            options.callbacks.show = async (crosshairs) => {
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await warpgate.wait(100);
                    ray = new Ray(summonerToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (summonerToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = tokenDocument.texture.src;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + options.range + 'ft.';
                }
            };
        }
        return await new Summons._spawn(tokenDocument, updates, options.callbacks, options);
    }
    async _spawn(tokenDocument, updates, callbacks, options) {
        let actorUpdates = updates.actor;
        let tokenUpdates = updates.token;
        let embeddedUpdates = updates.embedded;

        // check permissions
        // sets ownership on actorData
        let actorData = {
            ownership: {[game.user.id]: CONST.DOCUMENT_PERMISSION_LEVELS.OWNER}
        };
        mergeObject(updates, {token: mergeObject(updates.token ?? {}, {actorData}, {overwrite:false})});
        /*
        const tokenImg = protoData.texture.src;
        const rotation = updates.token?.rotation ?? protoData.rotation ?? 0;
        const crosshairsConfig = foundry.utils.mergeObject(options.crosshairs ?? {}, {
        size: protoData.width,
        icon: tokenImg,
        name: protoData.name,
        direction: 0,
        }, {inplace: true, overwrite: false});

        crosshairsConfig.direction += rotation;

        const templateData = await showCrosshairs(crosshairsConfig, callbacks);
        }
        {x: templateData.x, y: templateData.y, size: templateData.size, cancelled: templateData.cancelled}
        let spawnLocation = {x: templateData.x, y:templateData.y}
        mergeObject(updates, {token: {rotation: templateData.direction, width: templateData.size, height: protoData.height*scale}});
        const actorFlags = {
            [MODULE.data.name]: {
                control: {user: game.user.id, actor: options.controllingActor?.uuid},
            }
        }
        */
        //tokenDocument.delta.updateSource(actorUpdates);
        let sourceActor = await fromUuid('Actor.zgNvjPBJYEoVDdgP');

        let tokUpdates = {name: 'Imma Summon', x: 500, y: 500};
        //let actorUpdates = {name: 'Imma Summon', x: 500, y: 500};

        let tokDoc = await sourceActor.getTokenDocument(tokUpdates);

        await tokDoc.delta.updateSource(actorUpdates);

        //actor.update(actorUpdates) as well

        console.log(tokDoc);

        let token = await canvas.scene.createEmbeddedDocuments('Token', [tokDoc]);
        console.log(token);
    }
}