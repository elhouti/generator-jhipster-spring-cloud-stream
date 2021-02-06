const _ = require('lodash');
const chalk = require('chalk');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const jsYaml = require('js-yaml');
const shelljs = require('shelljs');

module.exports = {
    writeFiles
};

const CONSUMER_COMPONENT = 'consumer';
const PRODUCER_COMPONENT = 'producer';
const MODULE_NAME = 'generator-jhipster-kafka';

function writeFiles(generator) {
    initVariables(generator);
    addDependencies(generator);
    registerToEntityPostHook(generator);

    /**
     * add dependencies according to the build tool present in the application.
     * @param generator
     */
    function addDependencies(generator) {
        const vavrVersion = '0.10.3';
        if (generator.buildTool === 'maven') {
            generator.addMavenProperty('vavr.version', vavrVersion);
            generator.addMavenDependency('io.vavr', 'vavr', '${vavr.version}'); // eslint-disable-line no-template-curly-in-string
        } else if (generator.buildTool === 'gradle') {
            generator.addGradleProperty('vavr_version', vavrVersion);
            generator.addGradleDependency('implementation', 'io.vavr', 'vavr', '${vavr_version}'); // eslint-disable-line no-template-curly-in-string
        }
    }

    if (generator.options['skip-prompts']) {
        generator.template(
            'src/main/java/package/service/kafka/consumer/GenericConsumer.java.ejs',
            `${generator.javaDir}service/kafka/consumer/GenericConsumer.java`
        );
        generator.template(
            'src/main/java/package/service/kafka/serde/DeserializationError.java.ejs',
            `${generator.javaDir}service/kafka/serde/DeserializationError.java`
        );
    }

    generator.template('src/main/java/package/config/KafkaProperties.java.ejs', `${generator.javaDir}config/KafkaProperties.java`);

    writeKafkaDockerYaml(generator);
}

function initVariables(generator) {
    // read config from .yo-rc.json
    generator.baseName = generator.jhipsterAppConfig.baseName;
    generator.dasherizedBaseName = _.kebabCase(generator.baseName);
    generator.snakeCaseBaseName = _.snakeCase(generator.baseName);
    generator.packageName = generator.jhipsterAppConfig.packageName;
    generator.packageFolder = generator.jhipsterAppConfig.packageFolder;
    generator.clientFramework = generator.jhipsterAppConfig.clientFramework;
    generator.clientPackageManager = generator.jhipsterAppConfig.clientPackageManager;
    generator.buildTool = generator.jhipsterAppConfig.buildTool;

    // use constants from generator-constants.js
    generator.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + generator.packageFolder}/`;
    generator.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
    generator.testDir = `${jhipsterConstants.SERVER_TEST_SRC_DIR + generator.packageFolder}/`;
    generator.testResourceDir = jhipsterConstants.SERVER_TEST_RES_DIR;
    generator.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

    // show all variables
    generator.log('\n--- some config read from config ---');
    generator.log(`baseName=${generator.baseName}`);
    generator.log(`packageName=${generator.packageName}`);
    generator.log(`clientFramework=${generator.clientFramework}`);
    generator.log(`clientPackageManager=${generator.clientPackageManager}`);
    generator.log(`buildTool=${generator.buildTool}`);

    generator.log('\n--- some const ---');
    generator.log(`javaDir=${generator.javaDir}`);
    generator.log(`resourceDir=${generator.resourceDir}`);
    generator.log(`testDir=${generator.testDir}`);
    generator.log(`resourceDir=${generator.testResourceDir}`);
    generator.log(`webappDir=${generator.webappDir}`);
    generator.log(`dockerComposeFormatVersion=${generator.dockerComposeFormatVersion}`);
    generator.log(`dockerAkhq=${generator.dockerAkhq}`);

    if (generator.options['skip-prompts']) {
        generator.log('\n------');
        generator.log('Skipping prompts...');
    } else {
        generator.log('\n--- variables from questions ---');
        generator.log(`\nentities=${generator.entities}`);
        generator.log(`\ncomponentsPrefixes=${generator.componentsPrefixes}`);
        generator.log(`\npollingTimeout=${generator.pollingTimeout}`);
        generator.log(`\nautoOffsetResetPolicy=${generator.autoOffsetResetPolicy}`);
    }
    generator.log('------\n');
}

function writeKafkaDockerYaml(generator) {
    generator.kafkaVersion = jhipsterConstants.KAFKA_VERSION;
    generator.dockerComposeFormatVersion = jhipsterConstants.DOCKER_COMPOSE_FORMAT_VERSION;
    generator.dockerZookeeper = jhipsterConstants.DOCKER_ZOOKEEPER;
    generator.dockerKafka = jhipsterConstants.DOCKER_KAFKA;
    generator.dockerAkhq = 'tchiotludo/akhq:0.14.1';

    generator.log(`kafkaVersion=${generator.kafkaVersion}`);
    generator.log(`dockerComposeFormatVersion=${generator.dockerComposeFormatVersion}`);
    generator.log(`dockerZookeeper=${generator.dockerZookeeper}`);
    generator.log(`dockerKafka=${generator.dockerKafka}`);
    generator.log(`dockerAkhq=${generator.dockerAkhq}`);

    generator.template('src/main/docker/akhq.yml.ejs', `${jhipsterConstants.MAIN_DIR}docker/akhq.yml`, generator);

}

function registerToEntityPostHook(generator) {
    try {
        generator.registerModule(
            MODULE_NAME,
            'entity',
            'post',
            'entity',
            'A JHipster module that generates Apache Kafka consumers and producers and more!'
        );
    } catch (e) {
        generator.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`, e);
    }
}
