export class CharacterGenerator extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2)
{
	static DEFAULT_OPTIONS = {
		id: "character-generator",
	}

	static PARTS = {
		app: {
			template: "systems/acks/templates/apps/character-generator.hbs"
		}
	}

	get title()
	{
		return `Character Generator`;
	}

	/**
	 *
	 * @param {AcksActor} actor
	 * @param options
	 */
	constructor(actor, options = {})
	{
		super(options);

		this.actor = actor;
	}
}
