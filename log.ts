import * as _ from 'lodash';
import * as path from 'path';
import * as bunyan from 'bunyan';
import { config } from './config';
import * as PrettyStream from 'bunyan-prettystream';

const logger = bunyan.createLogger({
  name: `WS_${config.LOG_MARKER}`,
  serializers: _.extend({
    obj: objSerializer,
    ddfqlRaw: objSerializer
  }, bunyan.stdSerializers),
  streams: getBunyanStreams(config.NODE_ENV)
});

function getBunyanStreams(environment: string): any[] {
  const fileStream = {
    level: config.LOG_LEVEL,
    type: 'rotating-file',
    path: path.join(__dirname, '/../logs/waffle.log'),
    period: 'daily',
    count: 3
  };

  const consoleStream = {
    src: config.NODE_ENV === 'local',
    level: config.LOG_LEVEL,
    stream: (new PrettyStream()).pipe(process.stdout)
  };

  return [fileStream, consoleStream];
}

export interface LoggerOptions {
  loggerName: string;
  environment?: string;
  logMarker?: string;
}

function objSerializer(obj: any): any {
  return obj;
}

class LoggerFactory {
  private loggers: object = {
    waffle: logger
  };

  public createLogger(options: LoggerOptions): bunyan.Logger {
    const {loggerName, logMarker, environment} = options;
    if (!_.isEmpty(this.loggers[loggerName])) {
      return this.loggers[loggerName];
    }

    const _logger = bunyan.createLogger({
      name: `WS_${logMarker || config.LOG_MARKER}`,
      serializers: _.extend({
        obj: this.objSerializer,
        ddfqlRaw: this.objSerializer
      }, bunyan.stdSerializers),
      streams: this.getBunyanStreams(environment || config.NODE_ENV, loggerName)
    });

    this.loggers[loggerName] = _logger;

    return _logger;
  }

  public getLogger(loggerName: string = 'waffle'): bunyan.Logger {
    return this.loggers[loggerName];
  }

  private objSerializer(obj: any): any {
    return obj;
  }

  private getBunyanStreams(environment: string, loggerName: string): object[] {
    const fileStream = {
      level: config.LOG_LEVEL,
      type: 'rotating-file',
      path: path.join(__dirname, `/../logs/${loggerName}.log`),
      period: 'daily',
      count: 3
    };

    const consoleStream = {
      src: config.NODE_ENV === 'local',
      level: 'info',
      stream: (new PrettyStream()).pipe(process.stdout)
    };

    return [fileStream, consoleStream];
  }
}

const loggerFactory = new LoggerFactory();

export { logger, loggerFactory };
