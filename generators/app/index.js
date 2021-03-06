'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

const PROJECT_FILE = '.projects.yml';
const DEFAULT_VERSION = '1.0.0';

/**
  Gosh is a yeoman generator for simplified project management tasks.

  initializing - Your initialization methods (checking current project state, getting configs, etc)
  prompting - Where you prompt users for options (where you’d call this.prompt())
  configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
  default - If the method name doesn’t match a priority, it will be pushed to this group.
  writing - Where you write the generator specific files (routes, controllers, etc)
  conflicts - Where conflicts are handled (used internally)
  install - Where installations are run (npm, bower)
  end - Called last, cleanup, say good bye, etc

 */
module.exports = class Gosh extends Generator {
  // Initialize Gosh
  constructor(args, opts) {
    super(args, opts);

    this.option('init');
  }

  initializing() {
    // Have Yeoman greet the user.
    this.log(
      yosay(`Welcome to ${chalk.red('generator-gosh')}! A simple tool to help your day.`)
    );

    this.projectFileExists = this.fs.exists(PROJECT_FILE);
  }

  // Where you prompt users for options (where you’d call this.prompt())
  prompting() {
    const prompts = [];
    if (!this.projectFileExists) {
      prompts.push([
        {
          type: 'input',
          name: 'name',
          message: `Your project name? ${this.appname}`,
          default: this.appname
        },
        {
          type: 'choice',
          name: 'source_type',
          message: `Select your source control type. Sorry only GIT at this point :(`,
          choices: ['git'],
          default: 'git'
        },
        {
          type: 'input',
          name: 'source_server',
          message: `Provider your source control server Domain/IP: `
        }
      ]);
    }
    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  // Where you write the generator specific files (routes, controllers, etc)
  writing() {
    if (!this.projectFileExists) {
      this.fs.copyTpl(
        this.templatePath(PROJECT_FILE),
        this.destinationPath(PROJECT_FILE),
        {
          name: this.props.name,
          version: this.props.version || DEFAULT_VERSION,
          source: {
            type: this.props.source_type,
            server: this.props.source_server
          }
        }
      );
    }
  }
};
