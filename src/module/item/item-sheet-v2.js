import { AcksUtility } from "../utility.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class AcksItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
  constructor(...args) {
    super(...args);

    /**
     * Keep track of the currently active sheet tab
     * @type {string}
     */
  }

  static DEFAULT_OPTIONS = {
    classes: ["acks", "sheet", "item"],
    position: {
      width: 520,
      height: 390,
    },
    window: {
      resizable: false,
    },
  };

  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  static PARTS = {
    ability: {
      template: "systems/acks/templates/items/ability-sheet.html",
    },
    armor: {
      template: "systems/acks/templates/items/armor-sheet.html",
    },
    item: {
      template: "systems/acks/templates/items/item-sheet.html",
    },
    language: {
      template: "systems/acks/templates/items/language-sheet.html",
    },
    money: {
      template: "systems/acks/templates/items/money-sheet.html",
    },
    spell: {
      template: "systems/acks/templates/items/spell-sheet.html",
    },
    weapon: {
      template: "systems/acks/templates/items/weapon-sheet.html",
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    options.parts = [];

    switch (this.document.type) {
      case "ability":
        options.parts.push("ability");
        break;
      case "armor":
        options.parts.push("armor");
        break;
      case "item":
        options.parts.push("item");
        break;
      case "language":
        options.parts.push("language");
        break;
      case "money":
        options.parts.push("money");
        break;
      case "spell":
        options.parts.push("spell");
        break;
      case "weapon":
        options.parts.push("weapon");
        break;
    }
  }

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async _prepareContext() {
    const context = {};
    context.config = CONFIG.ACKS;
    context.system = this.document.system;
    context.effects = await AcksUtility.prepareActiveEffectCategories(this.item.effects);
    context.isGM = game.user.isGM;

    context.description = await TextEditor.enrichHTML(this.document.system.description, { async: true });

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    html.find('input[data-action="add-tag"]').keypress((ev) => {
      if (ev.which == 13) {
        let value = $(ev.currentTarget).val();
        let values = value.split(",");
        this.object.pushTag(values);
      }
    });

    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document = this.object;
      AcksUtility.onManageActiveEffect(ev, document);
    });

    html.find(".tag-delete").click((ev) => {
      let value = ev.currentTarget.parentElement.dataset.tag;
      this.object.popTag(value);
    });
    html.find("a.melee-toggle").click(() => {
      this.object.update({ "system.melee": !this.object.system.melee });
    });

    html.find("a.missile-toggle").click(() => {
      this.object.update({ "system.missile": !this.object.system.missile });
    });

    super.activateListeners(html);
  }
}
