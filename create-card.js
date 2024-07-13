const fetch = require('node-fetch');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const createIlvlFilter = require('./create-ilvl-filter');

function absolute(relativePath) {
  return path.join(__dirname, relativePath);
}

registerFont(absolute('./resources/SourceSansPro-Regular.ttf'), { family: 'Source Sans Pro', style: 'Regular' });
registerFont(absolute('./resources/SourceSansPro-SemiBold.ttf'), { family: 'Source Sans Pro', style: 'SemiBold' });

const primary = 'rgba(178, 214, 249, 1)';
const white = 'rgba(255, 255, 255,1)';
const grey = '#868686';
const black = 'rgba(0,0,0,0.5)';
const copyright = '11px "Source Sans Pro"';
const small = '18px "Source Sans Pro"';
const med = '30px "Source Sans Pro"';
const smed = '25px "Source Sans Pro"';
const large = '45px "Source Sans Pro SemiBold"';

const jobsRowTextStartX = 495;
const jobsRowTextSize = 30;
const jobsRowTextSpacer = jobsRowTextSize * 2;

const rectHeightRow1 = 120; // Title, Name, World
const rectHeightRow2 = 40; // Mounts, Minions
const rectHeightRow3 = 215; // Info
const rectHeightRow4 = 120; // Jobs
const rectHeightRow5 = 175; // Jobs

const rectSpacing = 8;
const rectHalfWidthSpacing = 10;

const rectFullWidth = 400;
const rectHalfWidth = (rectFullWidth / 2) - (rectHalfWidthSpacing / 2);

const rectStartX = 464;
const rectStartXHalf = rectStartX + rectHalfWidth + rectHalfWidthSpacing;

const rectStartRow1Y = 0;
const rectStartRow2Y = rectStartRow1Y + rectHeightRow1 + rectSpacing;
const rectStartRow3Y = rectStartRow2Y + rectHeightRow2 + rectSpacing;
const rectStartRow4Y = rectStartRow3Y + rectHeightRow3 + rectSpacing;
const rectStartRow5Y = rectStartRow4Y + rectHeightRow4 + rectSpacing;

const jobsStartSpacing = 10;
const jobsRowSpacing = 8;

const jobsRowIcon1Y = rectStartRow5Y + jobsStartSpacing;
const jobsRowText1Y = jobsRowIcon1Y + 45;

const jobsRowIcon2Y = jobsRowText1Y + jobsRowSpacing;
const jobsRowText2Y = jobsRowIcon2Y + 45;

const jobsRowIcon3Y = jobsRowText2Y + jobsRowSpacing;
const jobsRowText3Y = jobsRowIcon3Y + 45;

const textTitleY = rectStartRow1Y + 34;
const textServerY = rectStartRow1Y + 104;
const textNameNoTitleY = rectStartRow1Y + 59;
const textNameTitleY = rectStartRow1Y + 79;

const textMountMinionY = rectStartRow2Y + 28;
const iconMountMinionY = rectStartRow2Y + 5;

const deityIconY = rectStartRow3Y + 69;
const deityIconX = 805;

const gcRankIconY = rectStartRow3Y + 110;
const gcRankIconX = 799;

const fcCrestScale = 38;
const fcCrestY = rectStartRow3Y + 162;
const fcCrestX = 800;

const infoTextStartSpacing = 22;
const infoTextSmallStartY = rectStartRow3Y + infoTextStartSpacing;
const infoTextBigStartY = infoTextSmallStartY + 25;
const infoTextSpacing = 50;

const xivApiSupportedLanguages = ['en', 'ja', 'de', 'fr'];
const languageStrings = {
  en: {
    raceAndClan: 'Race & Clan',
    guardian: 'Guardian',
    grandCompany: 'Grand Company',
    freeCompany: 'Free Company',
    elementalLevel: 'Elemental Level',
    eurekaLevel: 'Level',
    resistanceRank: 'Resistance Rank',
    bozjaRank: 'Rank',
    mounts: 'Mounts',
    minions: 'Minions',
  },
  de: {
    raceAndClan: 'Volk & Stamm',
    guardian: 'Schutzgott',
    grandCompany: 'Staatliche Gesellschaft',
    freeCompany: 'Freie Gesellschaft',
    elementalLevel: 'Das Verbotene Land Eureka',
    eurekaLevel: 'Elementarstufe',
    resistanceRank: 'Bozja-Südfront',
    bozjaRank: 'Widerstandsstufe',
    mounts: 'Reittiere',
    minions: 'Begleiter',
  },
};

class CardCreator {
  /**
   * Creates a new card creator.
   * @constructor
   * @param {string} [xivApiKey] The API key for the XIV API to be used in all requests.
   */
  constructor(xivApiKey = undefined) {
    this.xivApiKey = typeof xivApiKey === 'string' && xivApiKey !== '' ? xivApiKey : undefined;
    this.initPromise = null;
  }

  /**
   * @typedef {Object} CardCreator~CanvasDimensions
   * @property {number} width The width of the canvas.
   * @property {number} height The height of the canvas.
   */

  /**
   * The canvas's dimensions.
   * @type {CardCreator~CanvasDimensions}
   */
  get canvasSize() {
    return {
      width: 890,
      height: 720,
    };
  }

  /**
   * Ensures that the instance is ready to generate character cards.
   * This function must be resolved before using character card
   * generation methods.
   * @returns {Promise} A promise representing the initialization state of this generator.
   */
  async ensureInit() {
    if (this.initPromise == null) this.initPromise = this.init();

    await this.initPromise;
  }

  async init() {
    const commonImagesPromise = Promise.all([
      loadImage(absolute('./resources/background.png')),
      loadImage(absolute('./resources/minion.png')),
      loadImage(absolute('./resources/mount.png')),
      loadImage(absolute('./resources/ilvl-icon.png')),
      loadImage(absolute('./resources/shadow.png')),
      loadImage(absolute('./resources/char_info.png')),
    ]).then(([background, minion, mount, ilvl, shadow, header]) => {
      this.images = {
        background, minion, mount, ilvl, shadow, header
      };
    });

    const classJobs = [
      'alchemist', 'armorer', 'blacksmith', 'carpenter', 'culinarian', 'goldsmith', 'leatherworker', 'weaver',
      'botanist', 'fisher', 'miner',
      'gladiator', 'paladin', 'marauder', 'warrior', 'darkknight', 'gunbreaker',
      'conjurer', 'whitemage', 'scholar', 'astrologian',
      'archer', 'bard', 'machinist', 'dancer',
      'lancer', 'dragoon', 'pugilist', 'monk', 'rogue', 'ninja', 'samurai',
      'thaumaturge', 'blackmage', 'arcanist', 'summoner', 'redmage',
      'bluemage', 'sage', 'reaper', 'viper', 'pictomancer'
    ];

    const classJobIconsPromise = Promise.all(
      classJobs.map(name => loadImage(absolute(`./resources/class-jobs-icons/${name}.png`)))
    ).then(images => {
      this.cjIcons = {};
      images.forEach((image, index) => this.cjIcons[classJobs[index]] = image);
    });

    const jobBackgroundsPromise = Promise.all(
      Array.from({ length: 42 }, (_, index) => loadImage(absolute(`./resources/class-jobs-backgrounds/${index + 1}.png`)))
    ).then(images => this.jobBackgrounds = images);

    const ilevelFilterPromise = createIlvlFilter(this.xivApiKey).then(filterIds => this.ilvlFilterIds = filterIds);

    const minionCountPromise = fetch(`https://ffxivcollect.com/api/minions/`)
      .then(response => response.json())
      .then(data => this.minionCount = data.count);

    const mountCountPromise = fetch(`https://ffxivcollect.com/api/mounts/`)
      .then(response => response.json())
      .then(data => this.mountCount = data.count);

    await Promise.all([
      commonImagesPromise,
      classJobIconsPromise,
      jobBackgroundsPromise,
      ilevelFilterPromise,
      minionCountPromise,
      mountCountPromise,
    ]);
  }

  async createCrest(crests) {
    if (!Array.isArray(crests) || crests.length == 0) return null;

    const canvas = createCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    const crestLayers = await Promise.all(crests.map(crest => loadImage(crest)));

    for (const layer of crestLayers) {
      ctx.drawImage(layer, 0, 0, 128, 128);
    }

    const imageData = ctx.getImageData(0, 0, 128, 128);
    const pixelData = imageData.data;

    // Iterate over all pixels, where one consists of 4 numbers: r, g, b and a
    for (let index = 0; index < pixelData.length; index += 4) {
      const [r, g, b] = pixelData.slice(index, index + 3);

      // If the pixel is a special grey, change it to be transparent (a = 0)
      if (r == 64 && g == 64 && b == 64) {
        pixelData[index] = 0;
        pixelData[index + 1] = 0;
        pixelData[index + 2] = 0;
        pixelData[index + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  getItemLevel(gearset) {
    let itemLevelSum = 0;

    for (const [key, piece] of Object.entries(gearset)) {

      // Exclude SoulCrystal from item level sum
      if (key !== 'SoulCrystal') {

        // If this item is a special one, increase the total item level by only 1
        if (this.ilvlFilterIds.includes(piece.Item.ID) === true) {
          itemLevelSum += 1;
        } else {
          itemLevelSum += piece.Item.LevelItem;
        }
      }
    }

    // Handle the gearset not having the offhand property, doesn't exist for DoW/DoM
    if (!gearset.hasOwnProperty('Offhand') && typeof gearset.MainHand != 'number') {
      const piece = gearset.MainHand;

      // If this item is a special one, increase the total item level by only 1
      if (this.ilvlFilterIds.includes(piece.Item.ID) === true) {
        itemLevelSum += 1;
      } else {
        itemLevelSum += piece.Item.LevelItem;
      }
    }

    // Average item level computation is always for 13 items
    // Job stones are ignored
    return this.pad(Math.floor(itemLevelSum / 12), 4);
  }

  pad(number, size) {
    const string = String(number);
    const paddingCount = Math.max(size - string.length, 0);
    return '0'.repeat(paddingCount) + string;
  }

  jobLevel(classJobList, jobName) {
    for (const cj of classJobList) {
      if (cj.UnlockedState.Name === jobName) {
        return cj.Level
      }
    }
    return "0"
  }

  classOrJobIcon(classJob, unlockId, className, jobName) {
    if (classJob?.UnlockedState?.ID === unlockId) return this.cjIcons[jobName];
    else return this.cjIcons[className];
  }

  /**
   * Creates a character card for a character.
   * @param {number | string} characterId The Lodestone ID of the character to generate a card for.
   * @param {string | Buffer | null | undefined} customImage Optional parameter providing a custom
   * image to be drawn between the background of the character card and the black information boxes.
   * The image should be the same resolution as the default image. The default image size can be
   * retrieved with {@link CardCreator#canvasSize}. May be a URL, `data: `URI, a local file path,
   * or a Buffer instance.
   * @param {string} [language] The language that the cards should be in use for the request
   * @example
   * const fs = require('fs');
   * 
   * const card = new CardCreator();
   * const lodestoneId = '13821878';
   * 
   * await card.ensureIni();
   * const png = await card.createCard(lodestoneId);
   * 
   * fs.writeFile('./test.png', png, err => {
   *   if (err) console.error(err);
   * });
   * @returns {Promise<Buffer>} A promise representating the construction of the card's image data.
   */
  async createCard(characterId, customImage, language = 'en') {
    const supportedLanguage = xivApiSupportedLanguages.includes(language) ? language : 'en';
    const strings = Object.keys(languageStrings).includes(supportedLanguage) ? languageStrings[supportedLanguage] : languageStrings.en;

    // Request all API data as early as possible
    const neededFields = [
      'Character.ActiveClassJob.UnlockedState.ID', 'Character.ClassJobs.*.Level', 'Character.ClassJobs.*.UnlockedState.ID', 'Character.ClassJobsBozjan.Level', 'Character.ClassJobsElemental.Level',
      'Character.DC', 'Character.FreeCompanyName', 'Character.GearSet.Gear', 'Character.GrandCompany.Company.Name', 'Character.GrandCompany.Rank.Icon', 'Character.GuardianDeity.Name',
      'Character.GuardianDeity.Icon', 'Character.Name', 'Character.Portrait', 'Character.Race.Name', 'Character.Tribe.Name', 'Character.Server', 'Character.Title.Name',
      'FreeCompany.Crest', 'FreeCompany.Tag', 'Minions.*.dummy', 'Mounts.*.dummy',
    ];

    const characterInfoUrl = new URL(`http://127.0.0.1:5002/character/${encodeURIComponent(characterId)}`)
    characterInfoUrl.searchParams.set('language', supportedLanguage);
    characterInfoUrl.searchParams.set('extended', '1');
    characterInfoUrl.searchParams.set('data', 'FC,MIMO');
    characterInfoUrl.searchParams.set('columns', neededFields.join(','));
    if (typeof this.xivApiKey === 'string' && this.xivApiKey !== '') url.searchParams.set('private_key', this.xivApiKey);

    const dataPromise = fetch(characterInfoUrl)
      // Retry once if the request fails
      .then(response => response.ok ? response : fetch(characterInfoUrl))
      .then(response => response.json());

    const customImagePromise = customImage != null ? loadImage(customImage) : Promise.resolve();
    const portraitPromise = dataPromise.then(data => loadImage(data.Character.Portrait));
    const deityPromise = dataPromise.then(data => loadImage(`${data.Character.GuardianDeity.Icon}`));
    const gcRankPromise = dataPromise.then(data => data.Character.GrandCompany.Company != null ? loadImage(`${data.Character.GrandCompany.Rank.Icon}`) : null);
    const fcCrestPromise = dataPromise.then(data => data.Character.FreeCompanyName != null ? this.createCrest(data.FreeCompany.Crest) : null);

    // Build canvas and only await data, when actually needed
    const canvasSize = this.canvasSize;
    const canvas = createCanvas(canvasSize.width, canvasSize.height);
    const ctx = canvas.getContext('2d');
    ctx.save();

    // Draw background
    ctx.drawImage(this.images.background, 0, 0, canvasSize.width, canvasSize.height + 2);

    // Draw custom background image
    const customLoadedImage = await customImagePromise;
    if (customLoadedImage != null) {
      ctx.drawImage(customLoadedImage, 0, 0, canvasSize.width, canvasSize.height);
    }

    // Draw dark background boxes
    ctx.fillStyle = black;
    ctx.drawImage(this.images.header ,0, 0, canvasSize.width, 120); // Name, Title, Server
    ctx.fillRect(rectStartX, rectStartRow2Y, rectHalfWidth, rectHeightRow2); // Mounts
    ctx.fillRect(rectStartXHalf, rectStartRow2Y, rectHalfWidth, rectHeightRow2); // Minions
    ctx.fillRect(rectStartX, rectStartRow3Y, rectFullWidth, rectHeightRow3); // Character information
    ctx.fillRect(rectStartX, rectStartRow4Y, rectFullWidth, rectHeightRow4); // Eureka & Bozja
    ctx.fillRect(rectStartX, rectStartRow5Y, rectFullWidth, rectHeightRow5); // Classes & Jobs
    ctx.restore(); ctx.save();

    // Draw non data dependent text
    ctx.textAlign = 'left';
    ctx.font = small;
    ctx.fillStyle = primary;
    ctx.fillText(strings.raceAndClan, 480, infoTextSmallStartY); // Race & Clan
    ctx.fillText(strings.guardian, 480, infoTextSmallStartY + infoTextSpacing); // Guardian
    ctx.fillText(strings.elementalLevel, 480, 425); // Elemental level
    ctx.fillText(strings.resistanceRank, 480, 475); // Resistance rank

    ctx.font = copyright;
    ctx.fillStyle = black;
    ctx.fillText(`© 2010 - ${new Date().getFullYear()} SQUARE ENIX CO., LTD. All Rights Reserved`, rectStartX, 720 - 5); // Copyright
    ctx.restore(); ctx.save();

    // Draw non data dependent images
    ctx.drawImage(this.images.shadow, 441 - 143, 110, 170, 90); // Item level shadow
    ctx.drawImage(this.images.mount, 620, iconMountMinionY, 32, 32); // Mount icon
    ctx.drawImage(this.images.minion, 834, iconMountMinionY, 19, 32); // Minion icon

    // Draw non data dependent job icons
    {
      ctx.drawImage(this.cjIcons.darkknight, 540, jobsRowIcon1Y, 30, 30); // Darkknight
      ctx.drawImage(this.cjIcons.gunbreaker, 570, jobsRowIcon1Y, 30, 30); // Gunbreaker
      ctx.drawImage(this.cjIcons.scholar, 660, jobsRowIcon1Y, 30, 30); // Scholar
      ctx.drawImage(this.cjIcons.astrologian, 690, jobsRowIcon1Y, 30, 30); // Astrologian
      ctx.drawImage(this.cjIcons.sage, 720, jobsRowIcon1Y, 30, 30); // Sage

      ctx.drawImage(this.cjIcons.pictomancer, 750, jobsRowIcon2Y, 30, 30); // Pictomancer

      ctx.drawImage(this.cjIcons.machinist, 780, jobsRowIcon1Y, 30, 30); // Machinist
      ctx.drawImage(this.cjIcons.dancer, 810, jobsRowIcon1Y, 30, 30); // Dancer
      ctx.drawImage(this.cjIcons.samurai, 570, jobsRowIcon2Y, 30, 30); // Samurai
      ctx.drawImage(this.cjIcons.reaper, 600, jobsRowIcon2Y, 30, 30); // Reaper
      ctx.drawImage(this.cjIcons.viper, 630, jobsRowIcon2Y, 30, 30); // Reaper
      ctx.drawImage(this.cjIcons.redmage, 720, jobsRowIcon2Y, 30, 30); // Redmage
      ctx.drawImage(this.cjIcons.bluemage, 810, jobsRowIcon2Y, 33, 33); // Bluemage

      ctx.drawImage(this.cjIcons.carpenter, 480, jobsRowIcon3Y, 30, 30); // Carpenter
      ctx.drawImage(this.cjIcons.blacksmith, 510, jobsRowIcon3Y, 30, 30); // Blacksmith
      ctx.drawImage(this.cjIcons.armorer, 540, jobsRowIcon3Y, 30, 30); // Armorer
      ctx.drawImage(this.cjIcons.goldsmith, 570, jobsRowIcon3Y, 30, 30); // Goldsmith
      ctx.drawImage(this.cjIcons.leatherworker, 600, jobsRowIcon3Y, 30, 30); // Leatherworker
      ctx.drawImage(this.cjIcons.weaver, 630, jobsRowIcon3Y, 30, 30); // Weaver
      ctx.drawImage(this.cjIcons.alchemist, 660, jobsRowIcon3Y, 30, 30); // Alchemist
      ctx.drawImage(this.cjIcons.culinarian, 690, jobsRowIcon3Y, 30, 30); // Culinarian
      ctx.drawImage(this.cjIcons.miner, 750, jobsRowIcon3Y, 30, 30); // Miner
      ctx.drawImage(this.cjIcons.botanist, 780, jobsRowIcon3Y, 30, 30); // Botanist
      ctx.drawImage(this.cjIcons.fisher, 810, jobsRowIcon3Y, 30, 30); // Fisher
    }

    // Draw info from character data
    const { Character, FreeCompany, Mounts, Minions } = await dataPromise;

    // Header
    {
      const activeClassJob = Character.ActiveClassJob.UnlockedState.ID ?? 36; // BLU returns a null UnlockedState.ID so we can't use it to pick the job image
      ctx.drawImage(this.jobBackgrounds[activeClassJob - 1], 450, 4, rectFullWidth, 110); // Current class/job background

      ctx.textAlign = 'center';
      ctx.font = med;
      ctx.fillStyle = primary;
      if (Character.Title.Name != null) ctx.fillText(Character.Title.Name, 450, 40); // Character title

      ctx.font = small;
      ctx.fillText(`${Character.Server} (${Character.DC})`, 450, 100); // Character service & DC

      ctx.font = large;
      ctx.fillStyle = white;
      ctx.fillText(Character.Name, 450, 80); // Character name
      ctx.restore(); ctx.save();
    }

    // Mounts & Minions
    {
      const mountsPercentage = Math.ceil(((Mounts.length ?? 0) / this.mountCount) * 100);
      const minionsPercentage = Math.ceil(((Minions.length ?? 0) / this.minionCount) * 100);

      ctx.font = smed;
      ctx.fillStyle = white;
      const mountsMeasure = ctx.measureText(`${mountsPercentage}%`);
      const minionsMeasure = ctx.measureText(`${minionsPercentage}%`);
      ctx.fillText(`${mountsPercentage}%`, 480, textMountMinionY); // Mounts percentage
      ctx.fillText(`${minionsPercentage}%`, 685, textMountMinionY); // Minions percentage

      ctx.font = small;
      ctx.fillStyle = grey;
      ctx.fillText(strings.mounts, 480 + mountsMeasure.width + 5, textMountMinionY); // Mounts
      ctx.fillText(strings.minions, 685 + minionsMeasure.width + 5, textMountMinionY); // Minions
      ctx.restore(); ctx.save();
    }

    // Character information
    {
      ctx.font = smed;
      ctx.fillStyle = white;
      ctx.fillText(`${Character.Race.Name}, ${Character.Tribe.Name}`, 480, infoTextBigStartY); // Race & Clan
      ctx.fillText(Character.GuardianDeity.Name, 480, infoTextBigStartY + infoTextSpacing); // Guardian

      if (Character.GrandCompany.Company != null) {
        ctx.font = small;
        ctx.fillStyle = primary;
        ctx.fillText(strings.grandCompany, 480, infoTextSmallStartY + infoTextSpacing * 2); // Grand Company

        ctx.font = smed;
        ctx.fillStyle = white;
        ctx.fillText(Character.GrandCompany.Company.Name.replace('[p]', ''), 480, infoTextBigStartY + infoTextSpacing * 2); // Grand Company name
      }

      if (Character.FreeCompanyName != null) {
        ctx.font = small;
        ctx.fillStyle = primary;
        ctx.fillText(strings.freeCompany, 480, infoTextSmallStartY + infoTextSpacing * 3); // Free Company

        ctx.font = smed;
        ctx.fillStyle = white;
        ctx.fillText(Character.FreeCompanyName, 480, infoTextBigStartY + infoTextSpacing * 3); // Free Company name

        const nameMeasure = ctx.measureText(Character.FreeCompanyName);
        ctx.font = small;
        ctx.fillStyle = grey;
        ctx.fillText(`«${FreeCompany.Tag}»`, 480 + nameMeasure.width + 10, infoTextBigStartY + infoTextSpacing * 3); // Free Company tag
      }
      ctx.restore(); ctx.save();
    }

    // Eureka & Bozja
    {
      ctx.font = smed;
      ctx.fillStyle = white;
      ctx.fillText(`${strings.eurekaLevel} ${Character.ClassJobsElemental.Level ?? 0}`, 480, 450); // Elemental level
      ctx.fillText(`${strings.bozjaRank} ${Character.ClassJobsBozjan.Level ?? 0}`, 480, 500); // Resistance rank
      ctx.restore(); ctx.save();
    }

    // Classes & Jobs - data dependant job or class icons
    {
      const { ClassJobs } = Character;
      ctx.drawImage(this.classOrJobIcon(ClassJobs[0], 19, 'gladiator', 'paladin'), 480, jobsRowIcon1Y, 30, 30); // Gladiator/Paladin
      ctx.drawImage(this.classOrJobIcon(ClassJobs[1], 21, 'marauder', 'warrior'), 510, jobsRowIcon1Y, 30, 30); // Marauder/Warrior
      ctx.drawImage(this.classOrJobIcon(ClassJobs[4], 24, 'conjurer', 'whitemage'), 630, jobsRowIcon1Y, 30, 30); // Conjurer/Whitemage
      ctx.drawImage(this.classOrJobIcon(ClassJobs[13], 23, 'archer', 'bard'), 750, jobsRowIcon1Y, 30, 30); // Archer/Bard
      ctx.drawImage(this.classOrJobIcon(ClassJobs[9], 22, 'lancer', 'dragoon'), 480, jobsRowIcon2Y, 30, 30); // Lancer/Dragoon
      ctx.drawImage(this.classOrJobIcon(ClassJobs[8], 20, 'pugilist', 'monk'), 510, jobsRowIcon2Y, 30, 30); // Monk/Pugilist
      ctx.drawImage(this.classOrJobIcon(ClassJobs[10], 30, 'rogue', 'ninja'), 540, jobsRowIcon2Y, 30, 30); // Ninja/Rogue
      ctx.drawImage(this.classOrJobIcon(ClassJobs[16], 25, 'thaumaturge', 'blackmage'), 660, jobsRowIcon2Y, 30, 30); // Thaumaturge/Blackmage
      ctx.drawImage(this.classOrJobIcon(ClassJobs[17], 27, 'arcanist', 'summoner'), 690, jobsRowIcon2Y, 30, 30); // Summoner/Arcanist
    }

    // Classes & Jobs - levels
    {
      ctx.textAlign = 'center';
      ctx.font = small;
      ctx.fillStyle = white;

      const { ClassJobs } = Character;

      // First row
      let rowTextX = jobsRowTextStartX;
      ctx.fillText(this.jobLevel(ClassJobs, "Paladin"), rowTextX, jobsRowText1Y); // Gladiator/Paladin
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Warrior"), rowTextX, jobsRowText1Y); // Marauder/Warrior
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Dark knight"), rowTextX, jobsRowText1Y); // Darkknight
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Gunbreaker"), rowTextX, jobsRowText1Y); // Gunbreaker
      rowTextX += jobsRowTextSpacer;
      ctx.fillText(this.jobLevel(ClassJobs, "White mage"), rowTextX, jobsRowText1Y); // Conjurer/Whitemage
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Scholar") >= 30 ? this.jobLevel(ClassJobs, "Scholar") : '0', rowTextX, jobsRowText1Y); // Scholar
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Astrologian"), rowTextX, jobsRowText1Y); // Astrologian
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Sage"), rowTextX, jobsRowText1Y); // Sage
      rowTextX += jobsRowTextSize;
      // Classes start moving after this
      ctx.fillText(this.jobLevel(ClassJobs, "Bard"), rowTextX, jobsRowText1Y); // Archer/Bard
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Machinist"), rowTextX, jobsRowText1Y); // Machinist
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Dancer"), rowTextX, jobsRowText1Y); // Dancer

      // Second row
      rowTextX = jobsRowTextStartX;
      ctx.fillText(this.jobLevel(ClassJobs, "Dragoon"), rowTextX, jobsRowText2Y); // Lancer/Dragoon
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Monk"), rowTextX, jobsRowText2Y); // Monk/Pugilist
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Ninja"), rowTextX, jobsRowText2Y); // Ninja/Rogue
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Samurai"), rowTextX, jobsRowText2Y); // Samurai
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Reaper"), rowTextX, jobsRowText2Y); // Reaper
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Viper"), rowTextX, jobsRowText2Y); // Viper
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Black mage"), rowTextX, jobsRowText2Y); // Thaumaturge/Blackmage
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Summoner"), rowTextX, jobsRowText2Y); // Summoner/Arcanist
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Red mage"), rowTextX, jobsRowText2Y); // Redmage
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Pictomancer"), rowTextX, jobsRowText2Y); // Pictomancer
      rowTextX += jobsRowTextSize;
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Blue mage"), rowTextX, jobsRowText2Y); // Bluemage

      // Third row
      rowTextX = jobsRowTextStartX;
      ctx.fillText(this.jobLevel(ClassJobs, "Carpenter"), rowTextX, jobsRowText3Y); // Carpenter
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Blacksmith"), rowTextX, jobsRowText3Y); // Blacksmith
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Armorer"), rowTextX, jobsRowText3Y); // Armorer
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Goldsmith"), rowTextX, jobsRowText3Y); // Goldsmith
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Leatherworker"), rowTextX, jobsRowText3Y); // Leatherworker
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Weaver"), rowTextX, jobsRowText3Y); // Weaver
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Alchemist"), rowTextX, jobsRowText3Y); // Alchemist
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Culinarian"), rowTextX, jobsRowText3Y); // Culinarian
      rowTextX += jobsRowTextSpacer;
      ctx.fillText(this.jobLevel(ClassJobs, "Miner"), rowTextX, jobsRowText3Y); // Miner
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Botanist"), rowTextX, jobsRowText3Y); // Botanist
      rowTextX += jobsRowTextSize;
      ctx.fillText(this.jobLevel(ClassJobs, "Fisher"), rowTextX, jobsRowText3Y); // Fisher
    }

    // Remaining asynchronous drawing
    {
      await Promise.all([
        portraitPromise.then(portrait => ctx.drawImage(portrait, 0, 120, 441, 600)),
        deityPromise.then(deityIcon => ctx.drawImage(deityIcon, deityIconX, deityIconY, 28, 28)),
        gcRankPromise.then(gcRankIcon => {
          if (gcRankIcon != null) ctx.drawImage(gcRankIcon, gcRankIconX, gcRankIconY, 40, 40);
        }),
        fcCrestPromise.then(fcCrestIcon => {
          if (fcCrestIcon != null) ctx.drawImage(fcCrestIcon, fcCrestX, fcCrestY, fcCrestScale, fcCrestScale);
        }),
      ]);
    }

    // Item level
    {
      ctx.font = smed;
      ctx.fillStyle = grey;
      ctx.drawImage(this.images.ilvl, 441 - 92, 132, 24, 27); // Item level icon
      ctx.fillText(this.getItemLevel(Character.GearSet.Gear).toString(), 441 - 40, 155); // Item level
      ctx.restore(); ctx.save();
    }

    return canvas.toBuffer();
  }
}

exports.CardCreator = CardCreator;
