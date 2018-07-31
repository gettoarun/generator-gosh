'use strict';
const Generator = require('yeoman-generator');

const fs = require('fs');

const rimraf = require('rimraf');

const _ = require('lodash');

const SOURCE_COMMANDS = ['config', 'add', 'pull', 'clean'];
const PROJECT_FILE = '.projects.yml';

let _yaml = require('js-yaml');

let readProjectFile = () => {
  return _yaml.safeLoad(fs.readFileSync(PROJECT_FILE, 'utf8'));
};
let writeProjectFile = obj => {
  return fs.writeFileSync(PROJECT_FILE, _yaml.safeDump(obj, {}));
};

class SourceHandler {
  constructor(generator) {
    this.generator = generator;
    this.log = generator.log;
    this.project = readProjectFile();
    if (!this.project.projects) {
      this.project.projects = [];
    }
  }

  isSupported(command) {
    return _.includes(SOURCE_COMMANDS, command);
  }

  getPrompts(command, options) {
    if (command === 'config') return this.getConfigPrompts(options);
    if (command === 'add') return this.getAddPrompts(options);
    if (command === 'pull') return this.getPullPrompts(options);
    if (command === 'clean') return this.getCleanPrompts(options);
  }

  doSourceAction(command, options) {
    if (command === 'config') return this.config(options);
    if (command === 'add') return this.add(options);
    if (command === 'pull') return this.pull(options);
    if (command === 'clean') return this.clean(options);
  }

  getConfigPrompts() {
    return [];
  }

  getAddPrompts(options) {
    var prompts = [];
    if (!options.name)
      prompts.push({
        type: 'input',
        name: 'name',
        message: `Your (sub-)project name?`
      });
    if (!options.group)
      prompts.push({
        type: 'input',
        name: 'grou',
        message: `Your (sub-)project group? (Optional)`,
        default: null
      });
    if (!options.url)
      prompts.push({
        type: 'input',
        name: 'url',
        message: `Your (sub-)project path (group/name.git) ?`
      });
    return prompts;
  }

  getPullPrompts() {
    return [];
  }

  getCleanPrompts() {
    return [];
  }

  config() {
    this.log(`configuring...`);
  }

  add(options) {
    this.log(`adding new project to set ${options.name}`);

    this.project.projects.push({
      name: options.name,
      group: options.group || 'default',
      url: options.url,
      type: options.node ? 'node' : 'java'
    });
    writeProjectFile(this.project);
  }

  pull() {
    this.log(`pulling...`);

    let self = this;
    _.each(this.project.projects, function(project) {
      if (self.project.source.multimode === 'clone') {
        self.log(`git clone git@${self.project.source.server}:${project.url}`);
        self.generator.spawnCommandSync('git', [
          'clone',
          `git@${self.project.source.server}:${project.url}`,
          project.name
        ]);
      } else if (self.project.source.multimode === 'subtree') {
        self.log(`subtree add --prefix=${project.name} ${project.name} master`);
        self.generator.spawnCommandSync('git', [
          'remote',
          'add',
          project.name,
          `git@${self.project.source.server}:${project.url}`
        ]);
        self.generator.spawnCommandSync(
          `git subtree add --prefix=${project.name} ${project.name} master`
        );
      }
    });
  }

  clean() {
    this.log(`cleaning...`);
    let self = this;
    _.each(this.project.projects, function(project) {
      self.log(`removing ${project.name}`);
      if (self.project.source.multimode === 'subtree') {
        self.generator.spawnCommandSync('git', ['remote', 'rm', project.name]);
      }
      rimraf.sync(`${project.name}`);
    });
  }
}

module.exports = class Source extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.handler = new SourceHandler(this);

    this.argument('command', { type: String, required: true });
    this.argument('name', { type: String, required: false });
    this.argument('url', { type: String, required: false });

    // Source Scope Options
    this.option('all', { alias: 'a' });

    // Project Language/Platform Options
    this.option('java', { alias: 'j' });
    this.option('node', { alias: 'n' });
  }

  prompting() {
    var prompts = this.handler.getPrompts(this.options.command, this.options);

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    this.log(`Performing ${this.options.command}...`);
    this.handler.doSourceAction(this.options.command, this.options);
  }
};
