# Development Tools

## Overview

This document provides information on the installation and usage of the development tools you'll need to work on FoundryVTT and ACKS.

**Table of Contents**

- [Development Tools](#development-tools)
  - [Overview](#overview)
  - [Descriptions and Rationale](#descriptions-and-rationale)
    - [Required Packages](#required-packages)
    - [Required Node.JS Packages](#required-nodejs-packages)
    - [Optional Packages](#optional-packages)
  - [Installation](#installation)
    - [Install Required Packages](#install-required-packages)
    - [Install Required Node.js Packages](#install-required-nodejs-packages)
    - [Install Optional Packages](#install-optional-packages)
  - [Usage Examples](#usage-examples)
    - [pandoc Usage](#pandoc-usage)
    - [mdview Usage](#mdview-usage)
    - [dos2unix Usage](#dos2unix-usage)
    - [iconv Usage](#iconv-usage)
    - [webp Usage](#webp-usage)
    - [FoundryVTT CLI Usage](#foundryvtt-cli-usage)

**Before Getting Started**

Please note:

> 1. These instructions assume you're running on Linux, either on a desktop install or a virtual environment like VirtualBox.
> 1. An equivalent on Windows is possible using the Windows GitHub tools and the Node,js environment for Windows. You'll need to research this on your own and adapt the instructions as needed.
> 1. The examples here are from `Ubuntu 24.04.1 LTS` running in VirtualBox on Windows 10.
> 1. Optional packages *are not* required for development; however, they are helpful so install what you want.

## Descriptions and Rationale

### Required Packages

- **gh** I don't remember why I installed this tool, so YMMV.
- **openssh-server** It's not installed by default on Ubuntu but it adds the ability to remotely administer your development machine.
- **openjdk-21-jre-headless** Used to run PlantUML.
- **default-jre** Or else this one was used to run PlantUML.
- **graphviz** Needed for PlantUML plus probably other diagram generation and conversion.
- **webp** Definitely needed to convert icons and other images from other formats into .webp formats.
- **iconv** Converts the encoding of a file from 1 format to another, which can be very helpful when attempting to open data files generated on a PC app like Excel.
-**FoundryVTT** See the separate section for Installing Foundry.

### Required Node.JS Packages

These are useful when running the Compendium generation and parsing tools.

You will need a Node project if you're working on the JS parsing code used to make compendium packs. You should probably create a separate project to make a standalone parser/processor for the data files. It does not need to run from the ACKS II source tree.

I *don't know* if there are negative side effects from installing them into the main ACKS Node package. Until this is known, use a separate project and use relative paths from your own project directory to read and write files in the ACKS packs directories.

Our guidance is:
> 1. Avoid committing changes to the ACKS build files, such as the files **package.json,** **package-lock.json,** or anything in the **.github** directory.
> 2. And if you do have a reason to update those files, please file a bug or feature request with some notes so we can research before making the update.

**Package List**

- **@foundryvtt/foundryvtt-cli** The Foundry VTT command-line interface which allows you to work with Compendium packs. Use this to unpack and repack from a compendium into a collection of JSON files.
- **papaparse** An excellent CSV / TSV text file parsing library that reads and writes from comma-separated or tab-separated value text files into a collection of JS objects within your script.
- **yargs** Command-line argument parsing library.

### Optional Packages

- **curl** This is called from a table-of-contents generator script I found.
- **dos2unix/unix2dos** Converts text file formats between windows / DOS (lines end with CR/LF) and Unix/Linux (lines end with LF).
- **mdview** Converts the specified markdown file into HTML and launches the system web browser (e.g. Firefox) to view it.
- **pandoc** Converts formats like MS Word to Markdown and does a pretty good job of it too. Recommended if turning mostly text documents to markdown.

## Installation

### Install Required Packages

Install the required and optional packages that were identified earlier:

```shell
sudo apt-get install curl
sudo apt-get install gh
sudo apt install openssh-server
sudo apt install openjdk-21-jre-headless
sudo apt install default-jre
sudo apt install graphviz
sudo apt install webp
```

Or install them all at once. This will be faster, as well:
```shell
sudo apt install -y curl gh openssh-server openjdk-21-jre-headless default-jre graphviz webp
```

This reinstall is listed separately. It is probably not needed. When I upgraded from Ubuntu 22.04 to Ubuntu 24.04, the upgrade screwed up my system for days. (That's the most likely reason I had to reinstall the desktop.)  
`sudo apt-get install --reinstall ubuntu-desktop`

### Install Required Node.js Packages

To install these tools into your Node project, you may need to create a Node package first, using **npm**

```shell
cd (your Node.js package directory)
npm install --save-dev @foundryvtt/foundryvtt-cli
npm install --save-dev papaparse
npm install --save-dev yargs
```

### Install Optional Packages

```shell
sudo apt install dos2unix
sudo apt install unix2dos
sudo apt install pandoc
sudo snap install mdview
```

Or, simplified as:
```shell
sudo apt install -y dos2unix unix2dos pandoc
sudo snap install mdview
```

## Usage Examples

### pandoc Usage

Some examples of converting a Microsoft Word file to a Markdown file:

```shell
pandoc -h
pandoc -f docx -t gfm input-ms-word-file.docx  -o output-markdown-file.md
pandoc -f docx -t gfm ./Autarch_Community_Use_Guidelines.docx ./autarch_community_use_guidelines.md
```

### mdview Usage

Some examples of using mdview to render and display Markdown files. Doing this should create a temporary HTML file and open it using your system's default web browser.

```shell
mdview --help
mdview autarch_community_use_guidelines.md
mdview README.md
mdview developer-tools.md
```

### dos2unix Usage

Read the options. Here is an example of converting dos-style line endings to Unix style.

```shell
dos2unix -h
unix2dos -h
dos2unix autarch-individual-contributor-license-agreement.md
```

### iconv Usage

See the documentation for iconv.

Here is an example of converting *from* (-f) UTF-16 *to* ISO_8859-1, and another example (?) of converting a file *to* UTF8.

```shell
iconv -f UTF-16 -t ISO_8859-1 -o outputfile  inputfile
iconv -t UTF8 -o Changelog2.md ./Changelog.md
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

**MORE TO COME**
> Pending addition of Foundry VTT / ACKS compendium generation.
