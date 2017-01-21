'use strict';

module.exports = {
  constructErrorMessage: function(options) {
    const errors = [];

    if (options.hasArguments) {
      errors.push('arguments were given to this command');
    }
    if (options.missingChannel) {
      errors.push('no Channel ID was provided');
    }
    if (options.missingUser) {
      errors.push('no User ID was provided');
    }

    const message = [];

    if (errors.length === 1) {
      message.push('The following error was encountered: ');
      message.push(errors.join('') + '.');
    } else if (errors.length === 2) {
      message.push('The following errors were encountered: ');
      message.push(errors.join(' and ') + '.');
    } else {
      const errorQuantity = errors.length;
      message.push('The following errors were encountered: ');
      const commaSeparated = errors.slice(0, errorQuantity - 1);
      message.push(commaSeparated.join(', ') + ', and ');
      const lastError = errors[errorQuantity - 1];
      message.push(lastError + '.');
    }

    return message.join('');
  }
};
