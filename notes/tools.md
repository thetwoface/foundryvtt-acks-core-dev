% Helpful Developer Tools

# General Development Workflow

## Required and Optional Tools

**Note**
> 1. All examples are taken from a Linux system running **Ubuntu 24.04.1 LTS.**
> 2. If you're currently running Ubuntu 22.xx don't upgrade just for this.
> 3. The optional tools *are not* required for development; however, they are helpful so install what you want.

### Required Tools

- **gh** I don't remember why so YMMV.
- **openssh-server** For a local development machine, why *wouldn't* you want to be able to remotely login to your system? It's not installed by default.
- **openjdk-21-jre-headless** Used to run PlantUML
- **default-jre** Or else this one was used to run PlantUML.
- **graphviz** Needed for PlantUML plus probably other diagram generation and conversion.
- **webp** Definitely needed to convert icons and other images from other formats into .webp formats.
- **iconv** Converts the encoding of a file from 1 format to another, which can be very helpful when attempting to open data files generated on a PC app like Excel.



### Optional Tools
- **curl** This is called from a table-of-contents generator script I found.
- **dos2unix/unix2dos** Converts text file formats between windows / DOS (lines end with CR/LF) and Unix/Linux (lines end with LF).
- **mdview** Converts the specified markdown file into HTML and launches the system web browser (e.g. Firefox) to view it.
- **pandoc** Converts formats like MS Word to Markdown and does a pretty good job of it too. Recommended if turning mostly text documents to markdown.

**Mandatory Node.JS tools** For running the Compendium generation and parsing tools.

- **@foundryvtt/foundryvtt-cli** The Foundry VTT command-line interface which allows you to work with Compendium packs. Use this to unpack and repack from a compendium into a collection of JSON files.
- **papaparse** An excellent CSV / TSV text file parsing library that reads and writes from comma-separated or tab-separated value text files into a collection of JS objects within your script.
- **yargs** Command-line argument parsing library.


### Installation

**Mandatory Tools**

This is kind of a questionable one, I don't remember why I did this? Possibly because the update to Ubuntu 24.04 screwed up my system terribly. `sudo apt-get install --reinstall ubuntu-desktop`

```shell
sudo apt-get install curl
sudo apt-get install gh
sudo apt install openssh-server
sudo apt install openjdk-21-jre-headless
sudo apt install default-jre
sudo apt install graphviz
sudo apt install webp
```

**Node.js Tools**

I'm a bit fuzzy on whether these could / should be installed into the main ACKS Core Game System repository. I plan to do that for testing and see what breaks.

If you have a separate Node development project, you will find these helpful to install. I *think* they can be installed into the ACKS VTT project directory.

```shell
cd (your acks project repository root directory which I think is also your Node.js package directory)
npm install --save-dev @foundryvtt/foundryvtt-cli
npm install --save-dev papaparse
npm install --save-dev yargs

```

**Optional Tools**

```shell
sudo apt-get install dos2unix
sudo apt-get install unix2dos
sudo snap install mdview
sudo apt install pandoc
```

### pandoc Usage

```shell
pandoc -h
pandoc -f docx -t gfm input-ms-word-file.docx  -o output-markdown-file.md
pandoc -f docx -t gfm ./Autarch_Community_Use_Guidelines.docx ./autarch_community_use_guidelines.md
```

### mdview Usage

```shell
mdview --help
mdview autarch_community_use_guidelines.md
mdview README.md
mdview developer-tools.md
```

### dos2unix Usage

```shell
dos2unix -h
unix2dos -h
```

### iconv Usage

See the documentation for iconv.

Convert from file formats UTF-16 and ISO_8859-1/
```shell
iconv -f UFT-16 -i ISO_8859-1 -o outputfile  input
```

### webp Usage

This is a series of semi-magical shell commands that will use shell scripting to loop across all the image files in a directory, and call the 'webp' converter to create a *.webp formatted file for each input file it finds.

**Note well** there are **back-ticks** enclosing each of the 3 lines in the example. This is what causes the command interpreter to run each line as a script. You could also put this into a shell script and call it as part of a build.

For ACKS, I converted the files then committed the converted webp files.

These are examples of 3 separate invocations that were done separately. I'm sure it could be improved.

```shell
`for file in game-icons/*.png; do cwebp -preset icon -resize 256 256 -mt -exact -lossless "$file" -o "${file%.*}.webp"; done`

`for file in bing-ai/*.png; do cwebp -preset icon -resize 256 256 -mt -exact -lossless "$file" -o "${file%.*}.webp"; done`

`for file in bing-ai/*.jpg; do cwebp -preset icon -resize 256 256 -mt -exact -lossless "$file" -o "${file%.*}.webp"; done`
```

### FoundryVTT CLI Usage

Refer to the tool's README at the following link:

https://github.com/foundryvtt/foundryvtt-cli


