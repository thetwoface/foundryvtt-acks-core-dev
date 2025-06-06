import { AcksUtility } from "../utility.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

export class AcksItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
  constructor(...args) {
    super(...args);
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["acks", "item-v2"],
    position: {
      width: 570,
      height: 400,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
      submitOnClose: true,
    },
    actions: {},
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "description", label: "ACKS.category.description" },
        { id: "effects", label: "ACKS.category.effects" },
      ],
      initial: "description",
    },
  };

  /** @override */
  tabGroups = {
    primary: "description",
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/acks/templates/items/v2/item/header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    description: {
      template: "systems/acks/templates/items/v2/item/description.hbs",
    },
    effects: {
      template: "systems/acks/templates/items/v2/item/effects.hbs",
      templates: ["systems/acks/templates/items/partials/item-generic-effects-tab.html"],
    },
  };

  get item() {
    return this.document;
  }

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async _prepareContext(options) {
    const context = {
      ...(await super._prepareContext(options)),
      item: this.item,
      config: CONFIG.ACKS,
      system: this.item.system,
      isGM: game.user.isGM,
      effects: await AcksUtility.prepareActiveEffectCategories(this.item.effects),
    };

    const enrichmentOptions = {
      secrets: this.item.isOwner,
      relativeTo: this.item,
    };

    context.enriched = {
      description: await TextEditor.enrichHTML(this.item.system.description, enrichmentOptions),
    };

    return context;
  }

  async _preparePartContext(partId, context, options) {
    switch (partId) {
      case "description":
      case "effects":
        context.tab = context.tabs[partId];
        break;
      default:
    }
    return context;
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    /*html.find('input[data-action="add-tag"]').keypress((ev) => {
      if (ev.which == 13) {
        let value = $(ev.currentTarget).val();
        let values = value.split(",");
        this.object.pushTag(values);
      }
    });*/

    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document = this.object;
      AcksUtility.onManageActiveEffect(ev, document);
    });

    /*html.find(".tag-delete").click((ev) => {
      let value = ev.currentTarget.parentElement.dataset.tag;
      this.object.popTag(value);
    });*/

    /*html.find("a.melee-toggle").click(() => {
      this.object.update({ "system.melee": !this.object.system.melee });
    });*/

    /*html.find("a.missile-toggle").click(() => {
      this.object.update({ "system.missile": !this.object.system.missile });
    });*/

    super.activateListeners(html);
  }
}
