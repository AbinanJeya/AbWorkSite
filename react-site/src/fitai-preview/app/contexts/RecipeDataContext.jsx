import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getSmartRecipes } from '../services/openai';
import { getSettings, getDiaryForDate, calcDiaryTotals, getUserProfile } from '../services/storage';

const RecipeDataContext = createContext(null);

const FILTERS = ['All', 'Under 10 Min', 'No-Cook', 'High Protein', 'Post-Workout'];

function todayKey() { return new Date().toISOString().slice(0, 10); }

export function RecipeDataProvider({ children }) {
    const [recipes, setRecipes] = useState({});
    const [loadingByFilter, setLoadingByFilter] = useState({});
    const [remaining, setRemaining] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70 });
    const recipesRef = useRef({});
    const remainingRef = useRef(remaining);
    const activeRequestsRef = useRef(new Set());
    const profileRef = useRef(null);

    useEffect(() => {
        recipesRef.current = recipes;
    }, [recipes]);

    useEffect(() => {
        remainingRef.current = remaining;
    }, [remaining]);

    const loading = useMemo(
        () => Object.values(loadingByFilter).some(Boolean),
        [loadingByFilter]
    );

    const updateRemaining = useCallback(async () => {
        try {
            const [settings, diary] = await Promise.all([
                getSettings(),
                getDiaryForDate(todayKey()),
            ]);

            const totals = calcDiaryTotals(diary);
            const goal = parseInt(settings.calorieGoal) || 2000;
            const macros = settings.macros || { carbs: 40, protein: 30, fats: 30 };

            const proteinGoal = Math.round((macros.protein / 100) * goal / 4);
            const carbsGoal = Math.round((macros.carbs / 100) * goal / 4);
            const fatsGoal = Math.round((macros.fats / 100) * goal / 9);

            const rem = {
                calories: Math.max(0, goal - totals.calories),
                protein: Math.max(0, proteinGoal - totals.protein),
                carbs: Math.max(0, carbsGoal - totals.carbs),
                fat: Math.max(0, fatsGoal - totals.fat),
            };
            setRemaining(rem);
            return rem;
        } catch (err) {
            console.error('Error updating remaining macros for recipes:', err);
            return remainingRef.current;
        }
    }, []);

    const ensureRecipesForFilter = useCallback(async (filter = 'All', options = {}) => {
        const targetFilter = FILTERS.includes(filter) ? filter : 'All';
        const { force = false, remainingOverride = null } = options;

        if (!force && recipesRef.current[targetFilter]) {
            return recipesRef.current[targetFilter];
        }
        if (activeRequestsRef.current.has(targetFilter)) {
            return recipesRef.current[targetFilter] || [];
        }

        activeRequestsRef.current.add(targetFilter);
        setLoadingByFilter(prev => ({ ...prev, [targetFilter]: true }));

        try {
            const currentRem = remainingOverride || await updateRemaining();
            if (!profileRef.current) {
                profileRef.current = await getUserProfile();
            }

            const nextRecipes = await getSmartRecipes(currentRem, targetFilter, profileRef.current);
            const sanitizedRecipes = Array.isArray(nextRecipes) ? nextRecipes : [];

            setRecipes(prev => {
                const updated = { ...prev, [targetFilter]: sanitizedRecipes };
                recipesRef.current = updated;
                return updated;
            });

            return sanitizedRecipes;
        } catch (err) {
            console.warn(`Recipe fetch failed for filter "${targetFilter}":`, err);
            return recipesRef.current[targetFilter] || [];
        } finally {
            activeRequestsRef.current.delete(targetFilter);
            setLoadingByFilter(prev => ({ ...prev, [targetFilter]: false }));
        }
    }, [updateRemaining]);

    useEffect(() => {
        (async () => {
            const rem = await updateRemaining();
            await ensureRecipesForFilter('All', { remainingOverride: rem, force: true });
        })();
    }, [ensureRecipesForFilter, updateRemaining]);

    const refreshRecipes = useCallback(async (filter = 'All') => {
        const rem = await updateRemaining();

        if (filter === 'All') {
            const clearedRecipes = { ...recipesRef.current };
            delete clearedRecipes.All;
            recipesRef.current = clearedRecipes;
            setRecipes(clearedRecipes);
            return ensureRecipesForFilter('All', { remainingOverride: rem, force: true });
        }

        return ensureRecipesForFilter(filter, { remainingOverride: rem, force: true });
    }, [ensureRecipesForFilter, updateRemaining]);

    return (
        <RecipeDataContext.Provider value={{
            recipes,
            loading,
            remaining,
            loadingByFilter,
            ensureRecipesForFilter,
            refreshRecipes,
            FILTERS,
        }}>
            {children}
        </RecipeDataContext.Provider>
    );
}

export function useRecipeData() {
    const ctx = useContext(RecipeDataContext);
    if (!ctx) throw new Error('useRecipeData must be used within RecipeDataProvider');
    return ctx;
}
