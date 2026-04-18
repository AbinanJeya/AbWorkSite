const LB_IN_KG = 0.45359237;
const MI_IN_KM = 0.62137119;

export const DEFAULT_UNITS = Object.freeze({
    weight: 'lbs',
    distance: 'km',
    measurement: 'cm',
});

function isFiniteNumber(value) {
    return Number.isFinite(value);
}

function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    const parsed = parseFloat(String(value ?? '').trim());
    return Number.isFinite(parsed) ? parsed : NaN;
}

export function roundToSingleDecimal(value) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.round(numeric * 10) / 10;
}

export function formatDisplayNumber(value, { decimals = 1 } = {}) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return '';
    const rounded = decimals >= 0 ? Number(numeric.toFixed(decimals)) : numeric;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function normalizeWeightUnit(unit, fallback = DEFAULT_UNITS.weight) {
    const normalized = String(unit || '').trim().toLowerCase();
    if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(normalized)) return 'kg';
    if (['lb', 'lbs', 'pound', 'pounds'].includes(normalized)) return 'lbs';
    return normalizeWeightUnit(fallback, DEFAULT_UNITS.weight);
}

export function normalizeDistanceUnit(unit, fallback = DEFAULT_UNITS.distance) {
    const normalized = String(unit || '').trim().toLowerCase();
    if (['mi', 'mile', 'miles'].includes(normalized)) return 'mi';
    if (['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'].includes(normalized)) return 'km';
    return fallback === 'mi' ? 'mi' : 'km';
}

export function normalizeMeasurementUnit(unit, fallback = DEFAULT_UNITS.measurement) {
    const normalized = String(unit || '').trim().toLowerCase();
    if (['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'].includes(normalized)) return 'cm';
    if (['in', 'inch', 'inches', 'ft', 'ft/in', 'imperial'].includes(normalized)) return 'in';
    return fallback === 'in' ? 'in' : 'cm';
}

export function resolveUnitsSettings(units = {}, profile = null) {
    return {
        weight: normalizeWeightUnit(units?.weight || profile?.weightUnit || DEFAULT_UNITS.weight),
        distance: normalizeDistanceUnit(units?.distance || DEFAULT_UNITS.distance),
        measurement: normalizeMeasurementUnit(units?.measurement || profile?.heightUnit || DEFAULT_UNITS.measurement),
    };
}

export function getWeightUnitLabel(unit, { uppercase = false } = {}) {
    const label = normalizeWeightUnit(unit) === 'kg' ? 'kg' : 'lbs';
    return uppercase ? label.toUpperCase() : label;
}

export function getDistanceUnitLabel(unit, { uppercase = false } = {}) {
    const label = normalizeDistanceUnit(unit) === 'mi' ? 'mi' : 'km';
    return uppercase ? label.toUpperCase() : label;
}

export function getMeasurementUnitLabel(unit, { uppercase = false, heightDisplay = false } = {}) {
    const normalized = normalizeMeasurementUnit(unit);
    const label = normalized === 'cm' ? 'cm' : (heightDisplay ? 'ft/in' : 'in');
    return uppercase ? label.toUpperCase() : label;
}

export function convertWeight(value, fromUnit, toUnit) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return NaN;
    const from = normalizeWeightUnit(fromUnit);
    const to = normalizeWeightUnit(toUnit);
    if (from === to) return numeric;
    return from === 'kg' ? numeric / LB_IN_KG : numeric * LB_IN_KG;
}

export function convertWeightString(value, fromUnit, toUnit) {
    const stringValue = String(value ?? '').trim();
    if (!stringValue) return '';
    const numeric = toNumber(stringValue);
    if (!Number.isFinite(numeric)) return stringValue;
    const converted = roundToSingleDecimal(convertWeight(numeric, fromUnit, toUnit));
    return formatDisplayNumber(converted);
}

export function convertDistance(value, fromUnit, toUnit) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return NaN;
    const from = normalizeDistanceUnit(fromUnit);
    const to = normalizeDistanceUnit(toUnit);
    if (from === to) return numeric;
    return from === 'km' ? numeric * MI_IN_KM : numeric / MI_IN_KM;
}

export function convertCentimetersToInches(value) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return NaN;
    return numeric / 2.54;
}

export function convertInchesToCentimeters(value) {
    const numeric = toNumber(value);
    if (!Number.isFinite(numeric)) return NaN;
    return numeric * 2.54;
}

export function feetInchesToInches(feet = 0, inches = 0) {
    const ft = Math.max(0, toNumber(feet) || 0);
    const inc = Math.max(0, toNumber(inches) || 0);
    return (ft * 12) + inc;
}

export function feetInchesToCentimeters(feet = 0, inches = 0) {
    return convertInchesToCentimeters(feetInchesToInches(feet, inches));
}

export function inchesToFeetInches(totalInches) {
    const numeric = Math.max(0, toNumber(totalInches) || 0);
    const feet = Math.floor(numeric / 12);
    const remainder = numeric - (feet * 12);
    const inches = Math.round(remainder * 10) / 10;
    return { feet, inches };
}

export function centimetersToFeetInches(totalCentimeters) {
    return inchesToFeetInches(convertCentimetersToInches(totalCentimeters));
}

export function parsePreviousSetLabel(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs?|lb|lbs)\s*x\s*([0-9]+(?:\.[0-9]+)?)$/i);
    if (!match) return null;
    return {
        weight: toNumber(match[1]),
        weightUnit: normalizeWeightUnit(match[2]),
        reps: toNumber(match[3]),
    };
}

export function formatPreviousSetLabel(weight, reps, weightUnit) {
    const weightValue = toNumber(weight);
    const repValue = toNumber(reps);
    if (!Number.isFinite(weightValue) || !Number.isFinite(repValue)) return '';
    const displayWeight = formatDisplayNumber(roundToSingleDecimal(weightValue));
    const displayReps = formatDisplayNumber(repValue);
    return `${displayWeight}${getWeightUnitLabel(weightUnit)} x ${displayReps}`;
}

export function convertPreviousSetLabel(value, targetUnit) {
    const parsed = parsePreviousSetLabel(value);
    if (!parsed) return '';
    const convertedWeight = roundToSingleDecimal(convertWeight(parsed.weight, parsed.weightUnit, targetUnit));
    return formatPreviousSetLabel(convertedWeight, parsed.reps, targetUnit);
}

function convertRoutineSet(setItem, sourceUnit, targetUnit) {
    const setUnit = normalizeWeightUnit(setItem?.weightUnit || sourceUnit);
    return {
        ...setItem,
        weight: convertWeightString(setItem?.weight, setUnit, targetUnit),
        weightUnit: targetUnit,
        prev: setItem?.prev ? convertPreviousSetLabel(setItem.prev, targetUnit) : setItem?.prev,
    };
}

export function convertRoutineExercisesWeightUnit(exercises = [], targetUnit, fallbackUnit = DEFAULT_UNITS.weight) {
    const resolvedTarget = normalizeWeightUnit(targetUnit);
    const resolvedFallback = normalizeWeightUnit(fallbackUnit);

    return (Array.isArray(exercises) ? exercises : []).map((exercise) => {
        const sourceUnit = normalizeWeightUnit(
            exercise?.weightUnit || exercise?.sets?.find?.((setItem) => setItem?.weightUnit)?.weightUnit || resolvedFallback
        );

        return {
            ...exercise,
            weight: convertWeightString(exercise?.weight, sourceUnit, resolvedTarget),
            weightUnit: resolvedTarget,
            bestWeight: isFiniteNumber(toNumber(exercise?.bestWeight))
                ? roundToSingleDecimal(convertWeight(exercise.bestWeight, sourceUnit, resolvedTarget))
                : exercise?.bestWeight,
            bestE1RM: isFiniteNumber(toNumber(exercise?.bestE1RM))
                ? roundToSingleDecimal(convertWeight(exercise.bestE1RM, sourceUnit, resolvedTarget))
                : exercise?.bestE1RM,
            sets: Array.isArray(exercise?.sets)
                ? exercise.sets.map((setItem) => convertRoutineSet(setItem, sourceUnit, resolvedTarget))
                : exercise?.sets,
        };
    });
}

export function convertWorkoutExerciseLogsWeightUnit(exerciseLogs = [], targetUnit, fallbackUnit = DEFAULT_UNITS.weight) {
    const resolvedTarget = normalizeWeightUnit(targetUnit);
    const resolvedFallback = normalizeWeightUnit(fallbackUnit);

    return (Array.isArray(exerciseLogs) ? exerciseLogs : []).map((exercise) => {
        const sourceUnit = normalizeWeightUnit(
            exercise?.weightUnit || exercise?.sets?.find?.((setItem) => setItem?.weightUnit)?.weightUnit || resolvedFallback
        );

        return {
            ...exercise,
            weight: convertWeightString(exercise?.weight, sourceUnit, resolvedTarget),
            weightUnit: resolvedTarget,
            bestWeight: isFiniteNumber(toNumber(exercise?.bestWeight))
                ? roundToSingleDecimal(convertWeight(exercise.bestWeight, sourceUnit, resolvedTarget))
                : exercise?.bestWeight,
            bestE1RM: isFiniteNumber(toNumber(exercise?.bestE1RM))
                ? roundToSingleDecimal(convertWeight(exercise.bestE1RM, sourceUnit, resolvedTarget))
                : exercise?.bestE1RM,
            sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).map((setItem) => {
                const setUnit = normalizeWeightUnit(setItem?.weightUnit || sourceUnit);
                return {
                    ...setItem,
                    weight: convertWeightString(setItem?.weight, setUnit, resolvedTarget),
                    weightUnit: resolvedTarget,
                    prev: setItem?.prev ? convertPreviousSetLabel(setItem.prev, resolvedTarget) : setItem?.prev,
                };
            }),
        };
    });
}

export function getProfileMeasurementSnapshot(profile = {}, fallbackUnit = DEFAULT_UNITS.measurement) {
    const measurementUnit = normalizeMeasurementUnit(profile?.heightUnit || fallbackUnit);

    if (measurementUnit === 'cm' && isFiniteNumber(toNumber(profile?.height))) {
        const centimeters = toNumber(profile.height);
        return {
            measurementUnit: 'cm',
            centimeters,
            inches: convertCentimetersToInches(centimeters),
        };
    }

    const explicitInches = toNumber(profile?.height);
    if (measurementUnit === 'in' && Number.isFinite(explicitInches)) {
        return {
            measurementUnit: 'in',
            centimeters: convertInchesToCentimeters(explicitInches),
            inches: explicitInches,
        };
    }

    const totalInches = feetInchesToInches(profile?.feet, profile?.inches);
    if (totalInches > 0) {
        return {
            measurementUnit: 'in',
            centimeters: convertInchesToCentimeters(totalInches),
            inches: totalInches,
        };
    }

    return {
        measurementUnit: normalizeMeasurementUnit(fallbackUnit),
        centimeters: NaN,
        inches: NaN,
    };
}

export function convertProfileMeasurement(profile = {}, targetUnit, fallbackUnit = DEFAULT_UNITS.measurement) {
    const snapshot = getProfileMeasurementSnapshot(profile, fallbackUnit);
    const resolvedTarget = normalizeMeasurementUnit(targetUnit);
    if (!Number.isFinite(snapshot.centimeters) && !Number.isFinite(snapshot.inches)) {
        return {
            ...profile,
            heightUnit: resolvedTarget,
        };
    }

    if (resolvedTarget === 'cm') {
        return {
            ...profile,
            height: roundToSingleDecimal(snapshot.centimeters),
            heightUnit: 'cm',
            feet: null,
            inches: null,
        };
    }

    const totalInches = roundToSingleDecimal(snapshot.inches);
    const feetInches = inchesToFeetInches(totalInches);
    return {
        ...profile,
        height: totalInches,
        heightUnit: 'in',
        feet: feetInches.feet,
        inches: feetInches.inches,
    };
}

export function convertProfileWeight(profile = {}, targetUnit, fallbackUnit = DEFAULT_UNITS.weight) {
    const currentUnit = normalizeWeightUnit(profile?.weightUnit || fallbackUnit);
    const resolvedTarget = normalizeWeightUnit(targetUnit);
    const numericWeight = toNumber(profile?.weight);

    return {
        ...profile,
        weight: Number.isFinite(numericWeight)
            ? roundToSingleDecimal(convertWeight(numericWeight, currentUnit, resolvedTarget))
            : profile?.weight,
        weightUnit: resolvedTarget,
    };
}
