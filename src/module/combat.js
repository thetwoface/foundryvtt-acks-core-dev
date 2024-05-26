import { AcksSurprise } from "./surprise-manager.js";
import { AcksUtility } from "./utility.js";

export class AcksCombatClass extends Combat {

  /*******************************************************/
  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   * @returns {Combatant[]}
   */
  setupTurns() {

    // Determine the turn order and the current turn
    const turns = this.combatants.contents.sort(this._sortCombatants);
    if (this.turn !== null) this.turn = Math.clamp(this.turn, 0, turns.length - 1);

    // Update state tracking
    let c = turns[this.turn];
    this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: c ? c.id : null,
      tokenId: c ? c.tokenId : null
    };

    // Return the array of prepared turns
    return this.turns = turns;
  }

  /*******************************************************/
  async internalStartCombat() {
    this._playCombatSound("startEncounter");
    let updateData = { round: 1, turn: 0 };

    await AcksCombat.individualInitiative(this, updateData);
    this.processOutNumbering();

    Hooks.callAll("combatStart", this, updateData);
    console.log(">>>>>>>>>> Start Combat", updateData);

    return this.update(updateData);
  }

  /*******************************************************/
  cleanupStatus(status) {
    this.combatants.forEach((cbt) => {
      if (cbt.actor.hasEffect(status)) {
        AcksUtility.removeEffect(cbt.actor, status);
      }
    });
  }

  /*******************************************************/
  async startCombat() {
    this.cleanupStatus("overnumbering")
    let pools = AcksCombat.getCombatantsPool();
    this.pools = pools;

    let surpriseDialog = new AcksSurprise({ pools, combatData: this });
    await surpriseDialog.render(true);
  }

  /*******************************************************/
  async nextTurn() {
    console.log("NEXT TURN");

    let turn = this.turn ?? -1;
    let skipDefeated = this.settings.skipDefeated;

    // Determine the next turn number
    let next = null;
    for (let [i, t] of this.turns.entries()) {
      console.log("Turn", t);
      if (i <= turn) continue;
      if (skipDefeated && t.isDefeated) continue;
      if (t.actor.hasEffect("surprised")) {
        if (this.round == 1) {
          ui.notifications.info(`${t.actor.name} is surprised, so skipped in initiative countdown.`);
          continue;
        } else {
          await AcksUtility.removeEffect(t.actor, "surprised");
        }
      }
      next = i;
      break;
    }

    // Maybe advance to the next round
    let round = this.round;
    if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
      return this.nextRound();
    }

    // Update the document, passing data through a hook first
    const updateData = { round, turn: next };
    const updateOptions = { advanceTime: CONFIG.time.turnTime, direction: 1 };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  /*******************************************************/
  async nextRound() {
    let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
    // Remove surprised effects
    if (this.round == 1) {
      this.turns.forEach(t => t.actor.hasEffect("surprised") ? AcksUtility.removeEffect(t.actor, "surprised") : null);
    }
    this.turns.forEach(t => t.actor.hasEffect("delayed") ? AcksUtility.removeEffect(t.actor, "delayed") : null);
    this.turns.forEach(t => t.actor.hasEffect("done") ? AcksUtility.removeEffect(t.actor, "done") : null);
    console.log("ROUND", this.round, this.turns);

    this.pools = AcksCombat.getCombatantsPool();
    await AcksCombat.individualInitiative(this);
    this.processOutNumbering();

    if (this.settings.skipDefeated && (turn !== null)) {
      turn = this.turns.findIndex(t => !t.isDefeated && (this.round == 1 && !t.actor.hasEffect("surprised")));
      if (turn === -1) {
        ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;
    let nextRound = this.round + 1;


    // Update the document, passing data through a hook first
    const updateData = { round: nextRound, turn };
    const updateOptions = { advanceTime, direction: 1 };
    Hooks.callAll("combatRound", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  /*******************************************************/
  processOutNumbering() {
    let pools = this.pools;
    let hostileMore = pools.hostile.length > pools.friendly.length;
    let friendlyMore = pools.friendly.length > pools.hostile.length;
    this.combatants.forEach((cbt) => {
      if (cbt.token.disposition == -1 && cbt.actor.hasEffect("overnumbering") && friendlyMore) {
        AcksUtility.removeEffect(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == 1 && cbt.actor.hasEffect("overnumbering") && hostileMore) {
        AcksUtility.removeEffect(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == -1 && !cbt.actor.hasEffect("overnumbering") && hostileMore) {
        AcksUtility.addUniqueStatus(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == 1 && !cbt.actor.hasEffect("overnumbering") && friendlyMore) {
        AcksUtility.addUniqueStatus(cbt.actor, "overnumbering");
      }
    });
  }

  /*******************************************************/
  _sortCombatants(a, b) {
    if (a.initiative === b.initiative) {
      if (a.actor.hasEffect("overnumbering")) {
        return 1;
      }
      if (b.actor.hasEffect("overnumbering")) {
        return -1;
      }
      return a.name.localeCompare(b.name);
    }
    return b.initiative - a.initiative;
  }

  /*******************************************************/
  async endCombat() {
    return Dialog.confirm({
      title: game.i18n.localize("COMBAT.EndTitle"),
      content: `<p>${game.i18n.localize("COMBAT.EndConfirmation")}</p>`,
      yes: () => {
        this.cleanupStatus("surprised");
        this.cleanupStatus("overnumbering");
        this.delete()
      }
    });
  }
}

export class AcksCombat {

  /*******************************************************/
  static async rollInitiative(combat, data) {
    // Initialize groups.
    data.combatants = [];
    let groups = {};
    combat.combatants.forEach((cbt) => {
      groups[cbt.flags.acks.group] = { present: true };
      data.combatants.push(cbt);
    });

    // Roll initiative for each group.
    for (const group in groups) {
      const roll = new Roll("1d6");
      await roll.evaluate({ async: true });
      await roll.toMessage({
        flavor: game.i18n.format('ACKS.roll.initiative', {
          group: CONFIG["ACKS"].colors[group],
        }),
      });

      groups[group].initiative = roll.total;
    }

    // Set the inititative for each group combatant.
    for (const combatant of data.combatants) {
      if (!combatant.actor) {
        return;
      }

      let initiative = groups[combatant.flags.acks.group].initiative;
      if (combatant.actor.system.isSlow) {
        initiative -= 1;
      }

      await combatant.update({
        initiative: initiative,
      });
    }

    combat.setupTurns();
  }

  /*******************************************************/
  static async resetInitiative(combat, data) {
    const reroll = game.settings.get("acks", "initiativePersistence");
    if (!["reset", "reroll"].includes(reroll)) {
      return;
    }

    combat.resetAll();
  }

  /*******************************************************/
  static async individualInitiative(combat, data) {
    const updates = [];
    const messages = [];

    let nbHostile = combat.pools.hostile.length;
    let nbFriendly = combat.pools.friendly.length;

    let index = 0;

    for (const [id, combatant] of combat.combatants.entries()) {
      const roll = combatant.getInitiativeRoll();
      await roll.evaluate({ async: true });
      let value = roll.total;

      if (combat.settings.skipDefeated && combatant.defeated) {
        value = -790;
      }

      updates.push({
        combatantId: id,
        _id: id,
        initiative: value,
      });

      // Determine the roll mode
      let rollMode = game.settings.get("core", "rollMode");
      if ((combatant.token.hidden || combatant.hidden)
        && (rollMode === "roll")) {
        rollMode = "gmroll";
      }

      // Construct chat message data
      const messageData = foundry.utils.mergeObject({
        speaker: {
          scene: canvas.scene._id,
          actor: combatant.actor?.id || null,
          token: combatant.token.id,
          alias: combatant.token.name
        },
        flavor: game.i18n.format('ACKS.roll.individualInit', {
          name: combatant.token.name,
        }),
      }, {});

      const chatData = await roll.toMessage(messageData, {
        rollMode,
        create: false,
      });

      // Only play one sound for the whole set.
      if (index > 0) {
        chatData.sound = null;
      }

      messages.push(chatData);

      ++index;
    }

    await combat.updateEmbeddedDocuments("Combatant", updates);
    await CONFIG.ChatMessage.documentClass.create(messages);

    // Now setup the first turn of the first round (ie surprised management)
    let turn = 0;
    if (data) {
      if (data.round == 1) {
        for (let i=0; i<combat.turns.length; i++) {
          if (!combat.turns[i].actor.hasEffect("surprised")) {
            turn = i;
            break;
          }
        }
      }
      data.turn = turn;
    }
  }

  /*******************************************************/
  static format(object, html, user) {
    html.find(".initiative").each((_, span) => {
      span.innerHTML =
        span.innerHTML == "-789.00"
          ? '<i class="fas fa-weight-hanging"></i>'
          : span.innerHTML;
      span.innerHTML =
        span.innerHTML == "-790.00"
          ? '<i class="fas fa-dizzy"></i>'
          : span.innerHTML;
    });

    html.find(".combatant").each((_, ct) => {
      // Append spellcast and retreat
      const controls = $(ct).find(".combatant-controls .combatant-control");
      console.log("Combat controls", ct.dataset);
      if (ct?.dataset?.combatantId) {
        const cmbtant = game.combat.combatants.get(ct.dataset.combatantId);
        const actionDone = cmbtant.actor.hasEffect("done") ? "active": "";
        controls.eq(1).after(
          `<a class='combatant-control action-done ${actionDone}' data-tooltip="Done"><i class='fas fa-check'></i></a>`
        );
        const readied = cmbtant.actor.hasEffect("readied") ? "active": "";
        controls.eq(1).after(
          `<a class='combatant-control click-readied ${readied}' data-tooltip="Readied"><i class='fas fa-thumbs-up'></i></a>`
        );
        const delayed = cmbtant.actor.hasEffect("delayed") ? "active": "";
        controls.eq(1).after(
          `<a class='combatant-control click-delayed ${delayed}' data-tooltip="Delayed"><i class='fas fa-clock'></i></a>`
        );
        const unconscious = cmbtant.actor.hasEffect("unconscious") ? "active": "";
        controls.eq(1).after(
          `<a class='combatant-control click-unconscious ${unconscious}' data-tooltip="Unconscious"><i class='fas fa-person-falling-burst'></i></a>`
        );
        const spellActive = cmbtant.flags.acks?.prepareSpell ? "active" : "";
        controls.eq(1).after(
          `<a class='combatant-control prepare-spell ${spellActive}' data-tooltip="Casting"><i class='fas fa-magic'></i></a>`
        );
      }
    });

    AcksCombat.announceListener(html);

    let init = game.settings.get("acks", "initiative") === "group";
    if (!init) {
      return;
    }

    html.find('.combat-control[data-control="rollNPC"]').remove();
    html.find('.combat-control[data-control="rollAll"]').remove();
    let trash = html.find(
      '.encounters .combat-control[data-control="endCombat"]'
    );
    $(
      '<a class="combat-control" data-control="reroll"><i class="fas fa-dice"></i></a>'
    ).insertBefore(trash);

    html.find(".combatant").each((_, ct) => {
      // Can't roll individual inits
      $(ct).find(".roll").remove();

      // Get group color
      const combatant = object.viewed.combatants.get(ct.dataset.combatantId);
      let color = combatant.flags.acks?.group;

      // Append colored flag
      let controls = $(ct).find(".combatant-controls");
      controls.prepend(
        `<a class='combatant-control flag' style='color:${color}' title="${CONFIG.ACKS.colors[color]}"><i class='fas fa-flag'></i></a>`
      );
    });

    AcksCombat.addListeners(html);
  }

  /*******************************************************/
  static updateCombatant(combat, combatant, data) {
    let init = game.settings.get("acks", "initiative");
    // Why do you reroll ?
    // Legacy Slowness code from OSE
    //    if (combatant.actor.data.data.isSlow) {
    //      data.initiative = -789;
    //      return;
    //    }
    if (data.initiative && init == "group") {
      let groupInit = data.initiative;
      // Check if there are any members of the group with init
      combat.combatants.forEach((ct) => {
        if (
          ct.initiative &&
          ct.initiative != "-789.00" &&
          ct._id != data._id &&
          ct.flags.acks.group == combatant.flags.acks.group
        ) {
          groupInit = ct.initiative;
          // Set init
          data.initiative = parseInt(groupInit);
        }
      });
    }
  }

  /*******************************************************/
  static announceListener(html) {
    html.find(".combatant-control.hold-turn").click(async (event) => {
      event.preventDefault();

      // Toggle hold announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      await combatant.update({
        _id: id,
        flags: {
          acks: {
            holdTurn: !isActive,
          },
        },
      });
    })

    html.find(".combatant-control.prepare-spell").click(async (event) => {
      event.preventDefault();

      // Toggle spell announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('actionDone');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "done")
      } else {
        AcksUtility.addUniqueStatus(combatant.actor, "done");
      }
    });

    html.find(".combatant-control.action-done").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "done")
      } else {
        AcksUtility.removeEffect(combatant.actor, "delayed");
        AcksUtility.removeEffect(combatant.actor, "readied");
        AcksUtility.addUniqueStatus(combatant.actor, "done");
      }
    });

    html.find(".combatant-control.click-readied").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "readied");
      } else {
        AcksUtility.removeEffect(combatant.actor, "delayed");
        AcksUtility.addUniqueStatus(combatant.actor, "readied");
      }
    });
    
    html.find(".combatant-control.click-delayed").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "delayed");
      } else {
        AcksUtility.removeEffect(combatant.actor, "readied");
        AcksUtility.addUniqueStatus(combatant.actor, "delayed");
      }
    });

    html.find(".combatant-control.click-unconscious").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "unconscious");
      } else {
        AcksUtility.addUniqueStatus(combatant.actor, "unconscious");
      }
    });

  }

  /*******************************************************/
  static addListeners(html) {
    // Cycle through colors
    html.find(".combatant-control.flag").click(async (event) => {
      event.preventDefault();

      if (!game.user.isGM) {
        return;
      }

      const currentColor = event.currentTarget.style.color;
      const colors = Object.keys(CONFIG.ACKS.colors);
      let index = colors.indexOf(currentColor);
      if (index + 1 == colors.length) {
        index = 0;
      } else {
        index++;
      }

      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const combatant = game.combat.combatants.get(id);
      await combatant.update({
        combatantId: id,
        _id: id,
        flags: {
          acks: {
            group: colors[index],
          },
        },
      });
    });

    html.find('.combat-control[data-control="reroll"]').click(async (event) => {
      event.preventDefault();

      if (!game.combat) {
        return;
      }

      const data = {};
      AcksCombat.rollInitiative(game.combat, data);

      await game.combat.update({
        data: data,
      })

      game.combat.setupTurns();
    });
  }

  /*******************************************************/
  static async addCombatant(combatant, options, userId) {
    let color = "black";
    switch (combatant.token.disposition) {
      case -1:
        color = "red";
        break;
      case 0:
        color = "yellow";
        break;
      case 1:
        color = "green";
        break;
    }

    await combatant.update({
      flags: {
        acks: {
          group: color,
        },
      },
    });
  }

  /*******************************************************/
  static activateCombatant(li) {
    const turn = game.combat.turns.findIndex(turn => turn._id === li.data('combatant-id'));
    game.combat.update({ turn: turn })
  }

  /*******************************************************/
  static addContextEntry(html, options) {
    options.unshift({
      name: "Set Active",
      icon: '<i class="fas fa-star-of-life"></i>',
      callback: AcksCombat.activateCombatant
    });
  }

  /*******************************************************/
  /* Sort current combatants in pools */
  static getCombatantsPool() {
    let pools = { friendly: [], neutral: [], hostile: [] };
    game.combat.combatants.forEach((cbt) => {
      if (cbt.token.disposition == 1) {
        pools.friendly.push(cbt);
      }
      if (cbt.token.disposition == -1) {
        pools.hostile.push(cbt);
      }
      if (cbt.token.disposition == 0) {
        pools.neutral.push(cbt);
      }
    });
    return pools;
  }

  /*******************************************************/
  static combatTurn(combat, data, options) {
  }


  /*******************************************************/
  static combatRound(combat, data, options) {
    // Cleanup surprised effects 

  }

  /*******************************************************/
  static async preUpdateCombat(combat, data, diff, id) {
  }
}