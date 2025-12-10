import type { LocalCommand } from '../types.js';

interface ExistingCommand {
  description: string;
  options?: any[];
  [key: string]: any;
}

export function areCommandsDifferent(
  existingCommand: ExistingCommand,
  localCommand: LocalCommand
): boolean {
  const existingOptions = existingCommand.options || [];
  const localOptions = localCommand.options || [];

  if (localCommand.description !== existingCommand.description) {
    return true;
  }

  if (localOptions.length !== existingOptions.length) {
    return true;
  }

  for (let i = 0; i < localOptions.length; i++) {
    const localOption = localOptions[i];
    const existingOption = existingOptions[i];

    if (
      localOption.name !== existingOption.name ||
      localOption.type !== existingOption.type ||
      localOption.description !== existingOption.description ||
      ('required' in localOption && 'required' in existingOption && localOption.required !== existingOption.required)
    ) {
      return true;
    }

    const localChoices = ('choices' in localOption && localOption.choices) || [];
    const existingChoices = ('choices' in existingOption && existingOption.choices) || [];
    
    if (localChoices.length !== existingChoices.length) {
      return true;
    }
  }

  return false;
}