import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {tashaSummon} from '../../../../utility/tashaSummon.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
  let sourceActor = game.actors.getName('CPR - Echo Knight');
  if (!sourceActor) return;
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
  let name = chris.getConfiguration(workflow.item, 'name');
  if (name === '' || !name) name = workflow.actor.name + ' Echo';
  let actorData = duplicate(workflow.actor.toObject());
  async function effectMacro3() {
    await chrisPremades.macros.manifestEcho.defeated(token, effect);
  }
  let effectData2 = {
    'name': workflow.item.name,
    'icon': workflow.item.img,
    'duration': {
      'seconds': 604800
    },
    'origin': workflow.item.uuid,
    'flags': {
      'effectmacro': {
        'onDelete': {
          'script': chris.functionToString(effectMacro3)
        }
      },
      'dae': {
        'specialDuration': [
          'zeroHP'
        ]
      },
      'chris-premades': {
        'vae': {
          'button': 'Dismiss Summon'
        },
        'feature': {
          'manifestEcho': {
            'ownerTokenUuid': workflow.token.document.uuid
          }
        }
      }
    }
  };
  let updates = {
    'actor': {
      'name': name,
      'system': {
        'abilities': {
          'str': {
            'value': workflow.actor.system.abilities.str.value
          },
          'con': {
            'value': workflow.actor.system.abilities.con.value
          },
          'dex': {
            'value': workflow.actor.system.abilities.dex.value
          },
          'int': {
            'value': workflow.actor.system.abilities.int.value
          },
          'wis': {
            'value': workflow.actor.system.abilities.wis.value
          },
          'cha': {
            'value': workflow.actor.system.abilities.cha.value
          }
        },
        'details': {
          'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof),
          'type': {
            'value': chris.raceOrType(workflow.actor)
          }
        },
        'attributes': {
          'ac': {
            'flat': 14 + workflow.actor.system.attributes.prof
          }
        }
      },
      'prototypeToken': {
        'name': name,
        'disposition': workflow.token.document.disposition,
        'sight': actorData.prototypeToken.sight
      },
      'flags': {
        'chris-premades': {
          'feature': {
            'manifestEcho': {
              'ownerUuid': workflow.actor.uuid
            }
          }
        }
      }
    },
    'token': {
      'name': name,
      'disposition': workflow.token.document.disposition,
      'sight': actorData.prototypeToken.sight
    },
    'embedded': {
      'ActiveEffect': {
        [effectData2.name]: effectData2
      }
    }
  };
  let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
  let tokenImg = chris.getConfiguration(workflow.item, 'token');
  if (avatarImg) updates.actor.img = avatarImg;
  if (tokenImg && tokenImg != '') {
    setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
    setProperty(updates, 'token.texture.src', tokenImg);
  } else {
    setProperty(updates, 'token.texture.src', workflow.token.document.texture.src);
    setProperty(updates, 'actor.prototypeToken.texture.src', workflow.token.document.texture.src);
  }
  let animationName = chris.getConfiguration(workflow.item, 'animation') ?? 'default';
  if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animationName = 'none';
  let spawnedTokens = await chris.spawn(sourceActor, updates, {}, workflow.token, 15, animationName);
  if (!spawnedTokens) return;
  let spawnedToken = canvas.tokens.get(spawnedTokens[0]);
  if (animationName != 'none') {
    new Sequence()
        .effect()
        .file('jb2a.smoke.puff.centered.grey')
        .atLocation(spawnedToken)
        .scale(0.5)
        .randomRotation()
        .delay(1200)
        .play();
  }
  let applyFilter = chris.getConfiguration(workflow.item, 'filter') ?? true;
  if (game.modules.get('tokenmagic')?.active && applyFilter) {
    let filter = [
      {
        'filterType': 'oldfilm',
        'filterId': 'myOldfilm',
        'sepia': 0.6,
        'noise': 0.2,
        'noiseSize': 1.0,
        'scratch': 0.8,
        'scratchDensity': 0.5,
        'scratchWidth': 1.2,
        'vignetting': 0.9,
        'vignettingAlpha': 0.6,
        'vignettingBlur': 0.2,
        'animated':
            {
              'seed': {
                'active': true,
                'animType': 'randomNumber',
                'val1': 0,
                'val2': 1
              },
              'vignetting': {
                'active': true,
                'animType': 'syncCosOscillation' ,
                'loopDuration': 2000,
                'val1': 0.2,
                'val2': 0.4
              }
            }
      },
      {
        'filterType': 'outline',
        'filterId': 'oldfilmOutline',
        'color': 0x000000,
        'thickness': 0,
        'zOrder': 61
        ,
      },
      {
        'filterType': 'fog',
        'filterId': 'myFog',
        'color': 0x000000,
        'density': 0.65,
        'time': 0,
        'dimX': 1,
        'dimY': 1,
        'animated': {
          'time': {
            'active': true,
            'speed': 2.2,
            'animType': 'move'
          }
        }
      }
    ];
    TokenMagic.addFilters(spawnedToken, filter);
  }
  if (sceneEchos.length) {
    let legionOfOne = chris.getItem(workflow.actor, 'Legion of One');
    let max = legionOfOne ? 2: 1;
    if (sceneEchos.length >= max) for (let i of sceneEchos) {
      animation(i);
      await warpgate.wait(700);
      await warpgate.dismiss(i.id);
    }
  }
  let effect = workflow.actor.effects.find(i => i.flags['chris-premades']?.feature?.manifestEcho);
  if (effect) return;
  let mutationStack = warpgate.mutationStack(workflow.token.document);
  if (mutationStack.getName('Manifest Echo')) await warpgate.revert(workflow.token.document, 'Manifest Echo');
  let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Dismiss', false);
  if (!featureData) return;
  featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Dismiss');
  let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Teleport', false);
  if (!featureData2) return;
  featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Teleport');
  let featureData3 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Manifest Echo - Attack', false);
  if (!featureData3) return;
  featureData3.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Manifest Echo - Attack');
  async function effectMacro () {
    await chrisPremades.macros.manifestEcho.dismiss({'workflow': {actor, token}});
  }
  async function effectMacro2() {
    await chrisPremades.macros.manifestEcho.turnEnd(token);
  }
  let effectData = {
    'name': workflow.item.name,
    'icon': workflow.item.img,
    'duration': {
      'seconds': 604800
    },
    'origin': workflow.item.uuid,
    'flags': {
      'effectmacro': {
        'onDelete': {
          'script': chris.functionToString(effectMacro)
        },
        'onTurnEnd': {
          'script': chris.functionToString(effectMacro2)
        }
      },
      'chris-premades': {
        'vae': {
          'button': featureData3.name
        },
        'feature': {
          'manifestEcho': true
        }
      }
    }
  };
  let updates2 = {
    'embedded': {
      'Item': {
        [featureData.name]: featureData,
        [featureData2.name]: featureData2,
        [featureData3.name]: featureData3
      },
      'ActiveEffect': {
        [effectData.name]: effectData
      }
    }
  };
  let options = {
    'permanent': false,
    'name': 'Manifest Echo',
    'description': 'Manifest Echo'
  };
  await warpgate.mutate(workflow.token.document, updates2, {}, options);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
  if (!sceneEchos.length) return;
  for (let i of sceneEchos) {
    animation(i);
    await warpgate.wait(700);
    await warpgate.dismiss(i.id);
  }
  await warpgate.revert(workflow.token.document, 'Manifest Echo');
}
async function teleport({speaker, actor, token, character, item, args, scope, workflow}) {
  if (!workflow.token) return;
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
  if (!sceneEchos.length) return;
  let targetToken;
  if (sceneEchos.length > 1) {
    let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, sceneEchos.map(i => i.object), true, 'one', null, false, 'Which Echo?');
    if (!selection.buttons) return;
    let targetTokenUuid = selection.inputs.find(i => i);
    if (!targetTokenUuid) return;
    targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
  } else {
    targetToken = sceneEchos[0];
  }
  if (chris.jb2aCheck() === 'patreon') {
    await swapAnimation(workflow.token, targetToken.object);
  } else {
    let updates = {
      'token': {
        'x': targetToken.x,
        'y': targetToken.y,
        'elevation': targetToken.elevation
      }
    }
    let updates2 = {
      'token': {
        'x': workflow.token.document.x,
        'y': workflow.token.document.y,
        'elevation': workflow.token.document.elevation
      }
    }
    let options = {
      'permanent': true,
      'name': 'Manifest Echo - Teleport',
      'description': 'Manifest Echo - Teleport',
      'updateOpts': {'token': {'animate': false}}
    };
    animation(targetToken.object);
    animation(workflow.token);
    await warpgate.wait(700);
    warpgate.mutate(workflow.token.document, updates, {}, options);
    warpgate.mutate(targetToken, updates2, {}, options);
  }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
  if (!workflow.targets.size) return;
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === workflow.actor.uuid);
  if (!sceneEchos.length) return;
  let targetToken;
  if (sceneEchos.length > 1) {
    let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, sceneEchos, true, 'one', null, false, 'Which Echo?');
    if (!selection.buttons) return;
    let targetTokenUuid = selection.inputs.find(i => i);
    if (!targetTokenUuid) return;
    let targetToken = await fromUuid(targetTokenUuid);
    if (!targetToken) return;
  } else {
    targetToken = sceneEchos[0];
  }
  let features = workflow.actor.items.filter(i => constants.weaponAttacks.includes(i.system.actionType) && (i.type === 'weapon' ? i.system.equipped : true));
  let feature;
  if (!features.length) {
    ui.notifications.info('You have no equipped weapons to attack with!');
    return;
  } else if (features.length > 1) {
    let selection = await chris.selectDocument(workflow.item.name, features);
    if (!selection) return;
    feature = selection[0];
  } else {
    feature = features[0];
  }
  let v5e = chris.v5eCheck();
  let effectData = {
    'icon': 'icons/magic/time/arrows-circling-green.webp',
    'origin': workflow.item.uuid,
    'duration': {
      'seconds': 1
    },
    'name': 'Manifest Echo - Range Override',
    'changes': [
      {
        'key': 'flags.midi-qol.rangeOverride.attack.all',
        'mode': 0,
        'value': '1',
        'priority': 20
      }
    ],
    'flags': {
      'chris-premades': {
        'effect': {
          'noAnimation': true
        }
      }
    }
  };
  let visionData = {
    icon: "icons/svg/eye.svg",
    origin: workflow.item.uuid,
    duration: {
      seconds: 1,
    },
    name: "Manifest Echo - Senses Override",
    changes: [
      {
        key: "system.attributes.senses.blindsight",
        mode: 5,
        value: workflow.actor.system.attributes.blindsight,
        priority: 20,
      },
      {
        key: "system.attributes.senses.darkvision",
        mode: 5,
        value: workflow.actor.system.attributes.darkvision,
        priority: 20,
      },
      {
        key: "system.attributes.senses.special",
        mode: 5,
        value: workflow.actor.system.attributes.special,
        priority: 20,
      },
      {
        key: "system.attributes.senses.tremorsense",
        mode: 5,
        value: workflow.actor.system.attributes.tremorsense,
        priority: 20,
      },
      {
        key: "system.attributes.senses.units",
        mode: 5,
        value: workflow.actor.system.attributes.units,
        priority: 20,
      },
    ],
    flags: {
      "chris-premades": {
        effect: {
          noAnimation: true,
        },
      },
    },
  };
  let effect = await chris.createEffect(workflow.actor, effectData);
  let effect2 = await chris.createEffect(targetToken.actor, effectData);
  let effect3;
  if (v5e) effect3 = await chris.createEffect(targetToken.actor, visionData);
  let options = {
    targetUuids: [workflow.targets.first().document.uuid],
  };
  await warpgate.wait(100);
  await MidiQOL.completeItemUse(feature, {}, options);
  await chris.removeEffect(effect);
  await chris.removeEffect(effect2);
  if (v5e) await chris.removeEffect(effect3);
}
async function turnEnd(token) {
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === token.actor.uuid);
  if (!sceneEchos.length) return;
  let maxRange = chris.findEffect(token.actor, 'Echo Avatar') ? 1000 : 30;
  let echosLeft = sceneEchos.length;
  for (let i of sceneEchos) {
    let distance = chris.getDistance(token, i, false);
    if (distance > maxRange) {
      let selection = await chris.remoteDialog('Echo Knight', constants.yesNo, chris.lastGM(), token.actor.name + '\'s echo has moved far away. Remove it?');
      if (!selection) continue;
      await warpgate.dismiss(i.id);
      echosLeft -= 1;
    }
  }
  if (!echosLeft) await warpgate.revert(token.document, 'Manifest Echo');
}
async function save(actor, roll, ability) {
  let ownerUuid = actor.flags['chris-premades']?.feature?.manifestEcho?.ownerUuid;
  if (!ownerUuid) return;
  let owner = fromUuidSync(ownerUuid);
  if (!owner) return;
  let selfBonuses = actor.system.abilities[ability].bonuses.save;
  let ownerBonuses = owner.system.abilities[ability].bonuses.save;
  let selfBonuses2 = actor.system.bonuses.abilities.save;
  let ownerBonuses2 = owner.system.bonuses.abilities.save;
  if (selfBonuses === ownerBonuses && selfBonuses2 === ownerBonuses2) return;
  let formula = '';
  if (selfBonuses != ownerBonuses) formula += ' + ' + ownerBonuses;
  if (selfBonuses2 != ownerBonuses2) formula += ' + ' + ownerBonuses2;
  let newRoll = new Roll('0 + ' + formula, owner.getRollData()).evaluate({'async': false});
  for (let i = 1; i < newRoll.terms.length; i++) roll.terms.push(newRoll.terms[i]);
  roll._total += newRoll.total;
  roll._formula = roll._formula + formula;
}
async function defeated(token, effect) {
  let sceneEchos = canvas.scene.tokens.filter(i => i.actor?.flags?.['chris-premades']?.feature?.manifestEcho?.ownerUuid === token.actor.flags['chris-premades'].feature.manifestEcho.ownerUuid && i.id != token.id);
  if (!sceneEchos.length) {
    let ownerTokenUuid = effect.flags['chris-premades']?.feature?.manifestEcho?.ownerTokenUuid;
    if (ownerTokenUuid) {
      let ownerToken = await fromUuid(ownerTokenUuid);
      if (ownerToken) {
        let effect2 = ownerToken.actor.effects.find(i => i.flags['chris-premades']?.feature?.manifestEcho);
        if (effect2) await chris.removeEffect(effect2);
        return;
      }
    }
  }
  animation(token);
  await warpgate.wait(700);
  warpgate.dismiss(token.id);
}
async function animation(token) {
  let animationName = chris.jb2aCheck() === 'patreon' ? 'jb2a.misty_step.01.grey' : 'jb2a.misty_step.01.blue'
  new Sequence()
      .effect()
      .file(animationName)
      .atLocation(token)
      .randomRotation()
      .scaleToObject(2)
      .play();
}
async function swapAnimation(source, target) {
  async function swap(source, target){
    new Sequence()
        .effect()
        .file('jb2a.misty_step.01.grey')
        .atLocation(source)
        .randomRotation()
        .scaleToObject(2)
        .wait(750)
        .animation()
        .on(source)
        .opacity(0.0)
        .waitUntilFinished()
        .effect()
        .file('jb2a.chain_lightning.primary.yellow')
        .atLocation(source)
        .stretchTo(target)
        .animation()
        .on(source)
        .teleportTo(target)
        .snapToGrid()
        .waitUntilFinished()
        .effect()
        .file('jb2a.misty_step.02.grey')
        .attachTo( source )
        .randomRotation()
        .scaleToObject(2)
        .wait(1500)
        .animation()
        .on(source)
        .opacity(1.0)
        .play();
  }
  await swap(source, target);
  await swap(target, source);
}
export let manifestEcho = {
  'item': item,
  'dismiss': dismiss,
  'teleport': teleport,
  'attack': attack,
  'turnEnd': turnEnd,
  'save': save,
  'defeated': defeated,
  'animation': animation,
  'swapAnimation': swapAnimation
}