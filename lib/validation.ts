/**
 * Input validation and sanitization for all user data before persistence or AI prompts.
 */

export class ValidationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// --- Sanitization ---

/** Strip potential HTML/script tags, trim, and enforce max length. */
export function sanitizeString(input: string, maxLength: number = 500): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

// --- Profile ---

const VALID_EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'competitor'] as const;

export function validateExperienceLevel(level: string): string {
  if (!VALID_EXPERIENCE_LEVELS.includes(level as typeof VALID_EXPERIENCE_LEVELS[number])) {
    throw new ValidationError('experienceLevel', `Must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`);
  }
  return level;
}

export function validateYearsExperience(years: number): number {
  if (!Number.isFinite(years) || years < 0 || years > 100) {
    throw new ValidationError('yearsExperience', 'Must be between 0 and 100');
  }
  return Math.round(years);
}

// --- Movement Skills ---

export interface ValidatedSkill {
  movementName: string;
  skillLevel: number;
  category: string | null;
}

const VALID_CATEGORIES = ['gymnastics', 'weightlifting', 'cardio', 'other'] as const;

export function validateMovementSkills(skills: { movementName: string; skillLevel: number; category?: string | null }[]): ValidatedSkill[] {
  if (!Array.isArray(skills)) {
    throw new ValidationError('skills', 'Must be an array');
  }
  if (skills.length > 200) {
    throw new ValidationError('skills', 'Cannot save more than 200 skills');
  }

  return skills.map((skill, i) => {
    if (!skill.movementName || typeof skill.movementName !== 'string') {
      throw new ValidationError(`skills[${i}].movementName`, 'Required non-empty string');
    }
    if (typeof skill.skillLevel !== 'number' || ![1, 2, 3, 4, 5].includes(skill.skillLevel)) {
      throw new ValidationError(`skills[${i}].skillLevel`, 'Must be 1-5');
    }
    const category = skill.category ?? null;
    if (category !== null && !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      throw new ValidationError(`skills[${i}].category`, `Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    return {
      movementName: sanitizeString(skill.movementName, 200),
      skillLevel: skill.skillLevel,
      category,
    };
  });
}

// --- Strength Numbers ---

export interface ValidatedLift {
  liftName: string;
  weightLbs: number;
}

export function validateStrengthNumbers(lifts: { liftName: string; weightLbs: number }[]): ValidatedLift[] {
  if (!Array.isArray(lifts)) {
    throw new ValidationError('lifts', 'Must be an array');
  }
  if (lifts.length > 50) {
    throw new ValidationError('lifts', 'Cannot save more than 50 lifts');
  }

  return lifts.map((lift, i) => {
    if (!lift.liftName || typeof lift.liftName !== 'string') {
      throw new ValidationError(`lifts[${i}].liftName`, 'Required non-empty string');
    }
    if (typeof lift.weightLbs !== 'number' || !Number.isFinite(lift.weightLbs) || lift.weightLbs < 0 || lift.weightLbs > 2000) {
      throw new ValidationError(`lifts[${i}].weightLbs`, 'Must be between 0 and 2000');
    }
    return {
      liftName: sanitizeString(lift.liftName, 200),
      weightLbs: Math.round(lift.weightLbs),
    };
  });
}

// --- Limitations ---

export interface ValidatedLimitation {
  type: 'injury' | 'equipment' | 'other';
  description: string;
}

const VALID_LIMITATION_TYPES = ['injury', 'equipment', 'other'] as const;

export function validateLimitations(limitations: { type: string; description: string }[]): ValidatedLimitation[] {
  if (!Array.isArray(limitations)) {
    throw new ValidationError('limitations', 'Must be an array');
  }
  if (limitations.length > 50) {
    throw new ValidationError('limitations', 'Cannot save more than 50 limitations');
  }

  return limitations.map((lim, i) => {
    if (!VALID_LIMITATION_TYPES.includes(lim.type as typeof VALID_LIMITATION_TYPES[number])) {
      throw new ValidationError(`limitations[${i}].type`, `Must be one of: ${VALID_LIMITATION_TYPES.join(', ')}`);
    }
    if (!lim.description || typeof lim.description !== 'string') {
      throw new ValidationError(`limitations[${i}].description`, 'Required non-empty string');
    }
    return {
      type: lim.type as ValidatedLimitation['type'],
      description: sanitizeString(lim.description, 1000),
    };
  });
}
