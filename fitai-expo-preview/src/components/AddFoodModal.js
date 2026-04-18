import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { useTheme } from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { searchFoodMultiple } from '../services/openai';
import { searchFoodDatabase, lookupBarcode } from '../services/foodDatabase';
import { getSettings, getSavedMeals, saveMeal, deleteSavedMeal, getSavedRecipes, deleteSavedRecipe, getRecentFoods } from '../services/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';

const ALL_UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'scoop', 'piece', 'serving', 'slice', 'bar', 'packet'];

const GRAMS_MAP = {
    g: 1, ml: 1, oz: 28, cup: 240, tbsp: 15, tsp: 5,
    scoop: 30, piece: 30, serving: 100, slice: 25, bar: 50, packet: 30, tablet: 5,
};

export function AddFoodModal({ visible, onClose, onAdd, mealType, onOpenMyMeals }) {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const skipAutoSearch = React.useRef(false);

    const [servingQty, setServingQty] = useState(1);
    const [servingUnit, setServingUnit] = useState('g');
    const [gramsPerUnit, setGramsPerUnit] = useState(1);
    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [showRecipes, setShowRecipes] = useState(false);
    const [showMyMeals, setShowMyMeals] = useState(false);

    const [showScanner, setShowScanner] = useState(false);
    const [savedMeals, setSavedMeals] = useState([]);
    const [expandedMealId, setExpandedMealId] = useState(null);

    const [savedRecipes, setSavedRecipes] = useState([]);
    const [expandedRecipeId, setExpandedRecipeId] = useState(null);

    const [activeMeal, setActiveMeal] = useState(mealType);
    const [showMealDropdown, setShowMealDropdown] = useState(false);

    // New search state
    const [recentFoods, setRecentFoods] = useState([]);
    const [showAiSearch, setShowAiSearch] = useState(false);
    const [aiSearching, setAiSearching] = useState(false);
    const [dbStatus, setDbStatus] = useState('ok');
    const [statusNote, setStatusNote] = useState('');
    const searchRequestRef = useRef(0);
    const activeSearchControllerRef = useRef(null);
    const inFlightQueryRef = useRef('');

    useEffect(() => {
        if (visible) {
            loadRecentFoods();
            loadMyMeals();
            loadRecipes();
            setActiveMeal(mealType);
        }
    }, [visible, mealType]);

    useEffect(() => {
        if (!visible) {
            reset();
        }
    }, [visible]);

    useEffect(() => {
        if (skipAutoSearch.current) {
            skipAutoSearch.current = false;
            return;
        }
        if (searchQuery.trim().length === 0) {
            if (activeSearchControllerRef.current) {
                activeSearchControllerRef.current.abort();
                activeSearchControllerRef.current = null;
            }
            setResults([]);
            setHasSearched(false);
            setSubmittedQuery('');
            setShowAiSearch(false);
            setDbStatus('ok');
            setStatusNote('');
            setSearching(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        return () => {
            if (activeSearchControllerRef.current) {
                activeSearchControllerRef.current.abort();
            }
        };
    }, []);

    const loadRecentFoods = async () => {
        const recent = await getRecentFoods(15);
        setRecentFoods(recent);
    };

    const loadMyMeals = async () => {
        const meals = await getSavedMeals();
        setSavedMeals(meals);
    };

    const loadRecipes = async () => {
        const r = await getSavedRecipes();
        setSavedRecipes(r);
    };

    const reset = () => {
        setSearchQuery(''); setResults([]); setHasSearched(false);
        setSubmittedQuery('');
        setExpandedIndex(null); setServingQty(1); setServingUnit('g'); setGramsPerUnit(1);
        setShowUnitPicker(false);
        setExpandedRecipeId(null);
        setShowRecipes(false);
        setShowMyMeals(false);
        setShowMealDropdown(false); setActiveMeal(mealType);
        setShowAiSearch(false); setAiSearching(false);
        setDbStatus('ok');
        setStatusNote('');
        if (activeSearchControllerRef.current) {
            activeSearchControllerRef.current.abort();
            activeSearchControllerRef.current = null;
        }
        inFlightQueryRef.current = '';
    };

    const mergeUniqueResults = (items) => {
        const seen = new Set();
        const merged = [];
        for (const item of items) {
            const key = `${(item.name || '').toLowerCase().trim()}::${(item.brand || '').toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
            }
        }
        return merged;
    };

    const normalizeSubmittedQuery = (value) => {
        if (typeof value === 'string') return value.trim();
        if (value && typeof value === 'object' && typeof value.nativeEvent?.text === 'string') {
            return value.nativeEvent.text.trim();
        }
        return typeof searchQuery === 'string' ? searchQuery.trim() : '';
    };

    const getToneColors = (tone) => {
        switch (tone) {
            case 'info':
                return { bg: colors.blueBg, text: colors.blue500 };
            case 'success':
                return { bg: colors.greenBg, text: colors.green500 };
            case 'primary':
                return { bg: colors.primaryDim, text: colors.primary };
            default:
                return { bg: colors.surface, text: colors.textSecondary };
        }
    };

    const matchingRecentFoods = submittedQuery.length >= 2
        ? recentFoods
            .filter((item) => (item.name || '').toLowerCase().includes(submittedQuery.toLowerCase()))
            .slice(0, 3)
        : [];

    const handleAddMealToDiary = (meal) => {
        onAdd({
            name: meal.name,
            calories: Math.round(meal.calories),
            protein: Math.round(meal.protein),
            carbs: Math.round(meal.carbs),
            fat: Math.round(meal.fat),
            serving: `1 meal (${meal.ingredients?.length || 0} items)`,
        }, activeMeal);
        reset();
        onClose();
    };

    const handleDeleteRecipe = async (recipe) => {
        Alert.alert('Delete Recipe', `Remove "${recipe.name}" from saved recipes?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteSavedRecipe(recipe.id);
                    loadRecipes();
                },
            },
        ]);
    };

    const handleAddRecipeToDiary = (recipe) => {
        onAdd({
            name: recipe.name,
            calories: Math.round(recipe.calories || 0),
            protein: Math.round(recipe.protein || 0),
            carbs: Math.round(recipe.carbs || 0),
            fat: Math.round(recipe.fat || 0),
            serving: recipe.serving || '1 serving',
        }, activeMeal);
        reset();
        onClose();
    };

    const handleDeleteMeal = (id, name) => {
        Alert.alert('Delete Meal', `Remove "${name}" from My Meals?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteSavedMeal(id);
                    loadMyMeals();
                }
            },
        ]);
    };

    const performSearch = async (query) => {
        if (!query.trim()) return;
        const frozenQuery = query.trim();
        if (activeSearchControllerRef.current) {
            activeSearchControllerRef.current.abort();
        }
        const requestId = searchRequestRef.current + 1;
        searchRequestRef.current = requestId;
        const controller = new AbortController();
        activeSearchControllerRef.current = controller;
        inFlightQueryRef.current = frozenQuery;

        setSearching(true);
        setHasSearched(true);
        setSubmittedQuery(frozenQuery);
        setExpandedIndex(null);
        setShowRecipes(false);
        setShowMyMeals(false);
        setDbStatus('ok');
        setStatusNote('');
        setResults([]);
        setShowAiSearch(false);
        try {
            const localMatches = recentFoods.filter(f => 
                (f.name || '').toLowerCase().includes(frozenQuery.toLowerCase())
            ).map(f => ({ ...f, source: 'history' }));

            const settings = await getSettings();
            const dbResponse = await searchFoodDatabase(frozenQuery, 10, { signal: controller.signal }).catch(err => {
                if (err?.name === 'AbortError') throw err;
                return { items: [], status: 'error', httpStatus: null, query: frozenQuery };
            });
            if (searchRequestRef.current !== requestId) {
                return;
            }

            const dbTagged = (dbResponse.items || []).map(r => ({ ...r, source: 'database' }));
            let merged = mergeUniqueResults([...localMatches, ...dbTagged]);
            let nextStatus = dbResponse.status || 'ok';
            let nextStatusNote = '';

            if ((nextStatus === 'unavailable' || nextStatus === 'error') && settings?.openAIKey) {
                const aiResults = await searchFoodMultiple(frozenQuery, settings.openAIKey).catch(() => []);
                if (searchRequestRef.current !== requestId) {
                    return;
                }
                const aiTagged = (aiResults || []).map(r => ({ ...r, source: 'ai' }));
                merged = mergeUniqueResults([...merged, ...aiTagged]);
                nextStatusNote = aiTagged.length > 0
                    ? 'Open Food Facts is unavailable, so showing AI matches for this search.'
                    : 'Open Food Facts is unavailable and no AI fallback matches were found.';
            }

            setResults(merged);
            setDbStatus(nextStatus);
            setStatusNote(nextStatusNote);
            setShowAiSearch(nextStatus === 'ok');
        } catch (err) {
            if (err?.name === 'AbortError') {
                return;
            }
            console.error('Food search error:', err);
            if (searchRequestRef.current === requestId) {
                setResults(recentFoods.filter(f => 
                    (f.name || '').toLowerCase().includes(frozenQuery.toLowerCase())
                ).map(f => ({ ...f, source: 'history' })));
                setDbStatus('error');
                setStatusNote('Could not refresh database matches for this search.');
                setShowAiSearch(true);
            }
        } finally {
            if (searchRequestRef.current === requestId) {
                setSearching(false);
                inFlightQueryRef.current = '';
                if (activeSearchControllerRef.current === controller) {
                    activeSearchControllerRef.current = null;
                }
            }
        }
    };

    const handleAiSearch = async () => {
        if (!submittedQuery.trim() || aiSearching) return;
        setAiSearching(true);
        try {
            const s = await getSettings();
            const aiResults = await searchFoodMultiple(submittedQuery, s.openAIKey).catch(() => []);
            const aiTagged = (aiResults || []).map(r => ({ ...r, source: 'ai' }));
            setResults(prev => mergeUniqueResults([...prev, ...aiTagged]));
            setShowAiSearch(false);
        } catch (err) {
            console.error('AI search failed:', err);
        }
        setAiSearching(false);
    };

    const handleSearch = (submittedQuery) => {
        const nextQuery = normalizeSubmittedQuery(submittedQuery);
        if (!nextQuery) return;
        Keyboard.dismiss();
        if (searching && inFlightQueryRef.current === nextQuery) {
            return;
        }
        if (nextQuery !== searchQuery) {
            setSearchQuery(nextQuery);
        }
        performSearch(nextQuery);
    };

    const handleBarcodeResult = async (barcodeString) => {
        if (activeSearchControllerRef.current) {
            activeSearchControllerRef.current.abort();
            activeSearchControllerRef.current = null;
        }
        setSearching(true);
        setHasSearched(true);
        setSubmittedQuery('');
        setShowRecipes(false);
        setShowMyMeals(false);
        setDbStatus('ok');
        setStatusNote('');
        try {
            const item = await lookupBarcode(barcodeString);
            if (item && item.name) {
                setResults([{ ...item, source: 'barcode' }]);
                setExpandedIndex(0);
                initServingFromItem(item);
                skipAutoSearch.current = true;
                setSearchQuery(item.name);
            } else {
                Alert.alert('Not Found', `No product found for barcode ${barcodeString}.`);
                setResults([]);
            }
        } catch (err) {
            console.error('Barcode lookup error:', err);
        }
        setSearching(false);
    };

    const initServingFromItem = (item) => {
        if (item.servingUnit && item.servingUnit !== 'g') {
            setServingUnit(item.servingUnit);
            setServingQty(item.servingQty || 1);
            setGramsPerUnit(item.gramsPerUnit || GRAMS_MAP[item.servingUnit] || 100);
        } else if (item.servingUnit === 'g' && item.servingQty) {
            setServingQty(item.servingQty);
            setServingUnit('g');
            setGramsPerUnit(1);
        } else {
            const match = item.serving?.match(/([\d.]+)/);
            setServingQty(match ? parseFloat(match[1]) : 100);
            setServingUnit('g');
            setGramsPerUnit(1);
        }
    };

    const handleExpand = (index) => {
        if (expandedIndex === index) {
            setExpandedIndex(null);
            setShowUnitPicker(false);
        } else {
            setExpandedIndex(index);
            setShowUnitPicker(false);
            initServingFromItem(results[index]);
        }
    };

    const totalGrams = servingQty * gramsPerUnit;
    const getScaled = (baseVal) => Math.round((baseVal / 100) * totalGrams * 10) / 10;

    const handleLogFood = (item) => {
        const unitLabel = servingUnit === 'g' ? `${Math.round(totalGrams)}g` : `${servingQty} ${servingUnit}`;
        onAdd({
            name: item.name,
            calories: Math.round(getScaled(item.calories)),
            protein: Math.round(getScaled(item.protein)),
            carbs: Math.round(getScaled(item.carbs)),
            fat: Math.round(getScaled(item.fat)),
            serving: unitLabel,
        }, activeMeal);
        reset();
        onClose();
    };

    const changeUnit = (newUnit) => {
        if (newUnit === 'g' || newUnit === 'ml') {
            setServingQty(Math.round(totalGrams * 10) / 10);
            setGramsPerUnit(1);
        } else {
            const gpu = GRAMS_MAP[newUnit] || 100;
            setGramsPerUnit(gpu);
            setServingQty(Math.round((totalGrams / gpu) * 10) / 10);
        }
        setServingUnit(newUnit);
        setShowUnitPicker(false);
    };

    const adjustQty = (delta) => {
        const step = servingUnit === 'g' || servingUnit === 'ml' ? 10 : 0.5;
        setServingQty(q => Math.max(step, Math.round((q + delta * step) * 10) / 10));
    };

    const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

    const getSourceBadge = (item) => {
        if (item?.matchLabel) {
            const tone = getToneColors(item.matchTone);
            return { label: item.matchLabel, color: tone.text, bg: tone.bg, icon: 'insights' };
        }
        const source = item?.source;
        switch (source) {
            case 'history': return { label: 'Recent', color: colors.textSecondary, bg: colors.surface, icon: 'history' };
            case 'ai': return { label: 'AI', color: colors.violet500, bg: colors.violetBg, icon: 'auto-awesome' };
            default: return null;
        }
    };

    const formatUnit = (u) => {
        const labels = { g: 'g', ml: 'ml', oz: 'oz', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', scoop: 'scoop', piece: 'pc', serving: 'srv', slice: 'slice', bar: 'bar', packet: 'pkt' };
        return labels[u] || u;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableWithoutFeedback onPress={() => { reset(); onClose(); }}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                <View style={styles.sheet} pointerEvents="box-none">
                    <View style={styles.handle} />
                    <View style={styles.sheetHeader}>
                        <TouchableOpacity onPress={() => { reset(); onClose(); }}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                        <Text style={styles.sheetTitle}>Log Food</Text>
                        <TouchableOpacity onPress={() => { reset(); onClose(); }}><Text style={styles.doneBtn}>Done</Text></TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.searchRow}>
                            <MaterialIcons name="search" size={18} color={colors.slate500} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search for food (e.g., Chicken Breast)"
                                placeholderTextColor={colors.slate500}
                                onSubmitEditing={(e) => handleSearch(e?.nativeEvent?.text)}
                                returnKeyType="search"
                            />
                            <View style={styles.searchActions}>
                                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                                    <MaterialIcons name="arrow-forward" size={18} color={colors.bgDark} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.camBtn} onPress={() => setShowScanner(true)}>
                                    <MaterialIcons name="qr-code-scanner" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.mealBadgeRow}>
                        <TouchableOpacity style={styles.mealBadge} onPress={() => setShowMealDropdown(!showMealDropdown)}>
                            <Text style={styles.mealBadgeText}>Adding to {mealLabels[activeMeal]}</Text>
                            <MaterialIcons name={showMealDropdown ? 'expand-less' : 'expand-more'} size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, showMyMeals && styles.pillActive]}
                            onPress={() => {
                                setShowMyMeals(true);
                                setShowRecipes(false);
                            }}
                        >
                            <MaterialIcons name="restaurant" size={14} color={showMyMeals ? colors.primary : colors.textMuted} />
                            <Text style={styles.pillText}>My Meals</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, showRecipes && styles.pillActive]}
                            onPress={() => {
                                setShowRecipes(true);
                                setShowMyMeals(false);
                            }}
                        >
                            <MaterialIcons name="menu-book" size={14} color={showRecipes ? colors.primary : colors.textMuted} />
                            <Text style={styles.pillText}>Recipes</Text>
                        </TouchableOpacity>
                    </View>

                    {showMealDropdown && (
                        <View style={styles.dropdown}>
                            {Object.entries(mealLabels).filter(([k]) => k !== activeMeal).map(([key, label]) => (
                                <TouchableOpacity key={key} style={styles.dropdownItem} onPress={() => { setActiveMeal(key); setShowMealDropdown(false); }}>
                                    <Text style={styles.dropdownText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <ScrollView style={styles.resultsList} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                        {showRecipes ? (
                            <View style={styles.recipeSheet}>
                                <Text style={styles.recipeSheetTitle}>Saved Recipes</Text>
                                <Text style={styles.recipeSheetSubtitle}>Full recipe cards stay expanded here so you can review ingredients before logging.</Text>
                                {savedRecipes.map((recipe) => {
                                    const isExp = expandedRecipeId === recipe.id;
                                    return (
                                        <TouchableOpacity key={recipe.id} style={styles.recipeCard} onPress={() => setExpandedRecipeId(isExp ? null : recipe.id)} activeOpacity={0.8}>
                                            <View style={styles.recipeHeader}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.recipeName}>{recipe.name}</Text>
                                                    <View style={styles.recipeTagRow}>
                                                        <View style={styles.recipeTag}>
                                                            <MaterialIcons name="schedule" size={10} color={colors.primary} />
                                                            <Text style={styles.recipeTagText}>{recipe.prepTime || '15 mins'}</Text>
                                                        </View>
                                                        <View style={[styles.recipeTag, styles.recipeTagHighlight]}>
                                                            <Text style={styles.recipeTagTextHighlight}>{recipe.tag || 'BALANCED'}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <Text style={styles.recipeCal}>{recipe.calories}</Text>
                                                <Text style={styles.recipeCalUnit}>kcal</Text>
                                            </View>
                                            <View style={styles.recipeMacros}>
                                                <View style={[styles.macroBadge, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                                                    <Text style={[styles.macroBadgeText, { color: '#3b82f6' }]}>P: {Math.round(recipe.protein || 0)}g</Text>
                                                </View>
                                                <View style={[styles.macroBadge, { backgroundColor: 'rgba(234,179,8,0.12)' }]}>
                                                    <Text style={[styles.macroBadgeText, { color: '#eab308' }]}>C: {Math.round(recipe.carbs || 0)}g</Text>
                                                </View>
                                                <View style={[styles.macroBadge, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                                    <Text style={[styles.macroBadgeText, { color: '#ef4444' }]}>F: {Math.round(recipe.fat || 0)}g</Text>
                                                </View>
                                                <View style={{ flex: 1 }} />
                                                {!isExp && (
                                                    <TouchableOpacity
                                                        style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '18' }}
                                                        onPress={(e) => { e.stopPropagation?.(); handleAddRecipeToDiary(recipe); }}
                                                        >
                                                            <MaterialIcons name="bookmark-border" size={16} color={colors.primary} />
                                                        </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,107,107,0.1)', marginLeft: 6 }}
                                                    onPress={(e) => { e.stopPropagation?.(); handleDeleteRecipe(recipe); }}
                                                >
                                                    <MaterialIcons name="delete-outline" size={16} color="#ff6b6b" />
                                                </TouchableOpacity>
                                            </View>
                                            {isExp && (
                                                <View style={styles.recipeBody}>
                                                    {!!recipe.prepTime && (
                                                        <View style={styles.recipeMetaPill}>
                                                            <MaterialIcons name="schedule" size={12} color={colors.primary} />
                                                            <Text style={styles.recipeMetaText}>{recipe.prepTime}</Text>
                                                        </View>
                                                    )}
                                                    {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                                                        <View style={styles.recipeSection}>
                                                            <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                                                            {recipe.ingredients.map((ingredient, index) => (
                                                                <Text key={`${recipe.id}-ingredient-${index}`} style={styles.recipeLineText}>• {ingredient}</Text>
                                                            ))}
                                                        </View>
                                                    )}
                                                    {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                                                        <View style={styles.recipeSection}>
                                                            <Text style={styles.recipeSectionTitle}>Steps</Text>
                                                            {recipe.steps.map((step, index) => (
                                                                <Text key={`${recipe.id}-step-${index}`} style={styles.recipeLineText}>{index + 1}. {step}</Text>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <View style={styles.recipeActions}>
                                                        <TouchableOpacity style={styles.addRecipeBtn} onPress={() => handleAddRecipeToDiary(recipe)}>
                                                            <MaterialIcons name="bookmark" size={14} color={colors.bgDark} />
                                                            <Text style={styles.addRecipeBtnText}>Save to Diary</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : showMyMeals ? (
                            <View style={styles.recipeSheet}>
                                <Text style={styles.recipeSheetTitle}>My Meals</Text>
                                <Text style={styles.recipeSheetSubtitle}>Create meals and log them from the same flow.</Text>
                                <TouchableOpacity style={styles.createMealBtn} onPress={() => onOpenMyMeals?.('create')}>
                                    <MaterialIcons name="add-circle" size={18} color={colors.primary} />
                                    <Text style={styles.createMealBtnText}>Create New Meal</Text>
                                </TouchableOpacity>
                                {savedMeals.map((meal) => {
                                    const isExp = expandedMealId === meal.id;
                                    return (
                                        <TouchableOpacity key={meal.id} style={styles.savedCard} onPress={() => setExpandedMealId(isExp ? null : meal.id)}>
                                            <View style={styles.cardTop}>
                                                <View style={{ flex: 1 }}><Text style={styles.cardName}>{meal.name}</Text><Text style={styles.cardMacro}>{meal.calories} kcal</Text></View>
                                                <MaterialIcons name={isExp ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
                                            </View>
                                            {isExp && (
                                                <TouchableOpacity style={styles.addBtn} onPress={() => handleAddMealToDiary(meal)}>
                                                    <Text style={styles.addBtnText}>Add to Diary</Text>
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View>
                                {submittedQuery.length >= 2 && (
                                    <View style={styles.queryBanner}>
                                        <View style={styles.queryBannerTop}>
                                            <Text style={styles.queryBannerLabel}>Showing results for</Text>
                                            <Text style={styles.queryBannerValue}>"{submittedQuery}"</Text>
                                        </View>
                                        <Text style={styles.queryBannerHint}>
                                            {searching
                                                ? 'Refreshing recent, database, and AI-assisted matches...'
                                                : dbStatus === 'ok'
                                                    ? 'Exact phrase matches are ranked first so broad OFF results stay under control.'
                                                    : 'Fallback matches stay visible when the database is having trouble.'}
                                        </Text>
                                    </View>
                                )}
                                {searching && (
                                    <View style={styles.loadingCard}>
                                        <ActivityIndicator color={colors.primary} />
                                        <Text style={styles.loadingText}>Searching nutrition matches...</Text>
                                    </View>
                                )}
                                {dbStatus === 'unavailable' && !searching && (
                                    <View style={styles.statusCard}>
                                        <Text style={styles.statusTitle}>Food database temporarily unavailable</Text>
                                        <Text style={styles.statusText}>{statusNote || 'Showing fallback results for this submitted search.'}</Text>
                                    </View>
                                )}
                                {dbStatus === 'error' && !searching && submittedQuery.length >= 2 && (
                                    <View style={styles.statusCard}>
                                        <Text style={styles.statusTitle}>Couldn&apos;t refresh food results</Text>
                                        <Text style={styles.statusText}>{statusNote || 'We kept any fallback matches on screen for this submitted search.'}</Text>
                                    </View>
                                )}
                                
                                {results.length === 0 && !searching && searchQuery.length === 0 && recentFoods.length > 0 && (
                                    <View>
                                        <Text style={styles.sectionHeader}>Recently Logged</Text>
                                        {recentFoods.map((item, idx) => (
                                            <TouchableOpacity key={idx} style={styles.card} onPress={() => { 
                                                setResults([item]); 
                                                setExpandedIndex(0); 
                                                skipAutoSearch.current = true;
                                                setSearchQuery(item.name); 
                                                initServingFromItem(item); 
                                            }}>
                                                <View style={styles.cardTop}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.cardName}>{item.name}</Text>
                                                        <Text style={styles.cardMacro}>{item.serving}</Text>
                                                        <View style={styles.recentMacroPills}>
                                                            <View style={[styles.recentMacroPill, { backgroundColor: colors.primaryDim }]}>
                                                                <Text style={[styles.recentMacroText, { color: colors.primary }]}>
                                                                    {Math.round(item.calories || 0)} kcal
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.recentMacroPill, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                                                                <Text style={[styles.recentMacroText, { color: '#3b82f6' }]}>
                                                                    P {Math.round(item.protein || 0)}g
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.recentMacroPill, { backgroundColor: 'rgba(234,179,8,0.12)' }]}>
                                                                <Text style={[styles.recentMacroText, { color: '#eab308' }]}>
                                                                    C {Math.round(item.carbs || 0)}g
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.recentMacroPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                                                                <Text style={[styles.recentMacroText, { color: '#ef4444' }]}>
                                                                    F {Math.round(item.fat || 0)}g
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <MaterialIcons name="history" size={16} color={colors.textMuted} />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {matchingRecentFoods.length > 0 && submittedQuery.length >= 2 && (
                                    <View style={styles.matchSection}>
                                        <Text style={styles.sectionHeader}>Recent matches</Text>
                                        {matchingRecentFoods.map((item, idx) => (
                                            <TouchableOpacity key={`${item.name}-${idx}`} style={styles.compactRecentCard} onPress={() => {
                                                setResults([item]);
                                                setExpandedIndex(0);
                                                skipAutoSearch.current = true;
                                                setSearchQuery(item.name);
                                                initServingFromItem(item);
                                            }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.compactRecentName}>{item.name}</Text>
                                                    <Text style={styles.compactRecentMeta}>{item.serving} • {item.calories} kcal</Text>
                                                </View>
                                                <View style={styles.compactRecentBadge}>
                                                    <MaterialIcons name="history" size={12} color={colors.textSecondary} />
                                                    <Text style={styles.compactRecentBadgeText}>Recent</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {results.map((item, idx) => {
                                    const isExp = expandedIndex === idx;
                                    const badge = getSourceBadge(item);

                                    // Calculate default macros for unexpanded card view
                                    let defaultGrams = 100;
                                    if (item.servingUnit && item.servingUnit !== 'g') {
                                        defaultGrams = (item.servingQty || 1) * (item.gramsPerUnit || GRAMS_MAP[item.servingUnit] || 100);
                                    } else if (item.servingUnit === 'g' && item.servingQty) {
                                        defaultGrams = item.servingQty;
                                    } else {
                                        const match = item.serving?.match(/([\d.]+)/);
                                        if (match) defaultGrams = parseFloat(match[1]);
                                    }
                                    const getDefMacro = (val) => Math.round(((val || 0) / 100) * defaultGrams * 10) / 10;

                                    return (
                                        <TouchableOpacity key={idx} style={[styles.card, isExp && styles.cardExp]} onPress={() => handleExpand(idx)}>
                                            <View style={styles.cardTop}>
                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                                                        {badge && <View style={[styles.badge, { backgroundColor: badge.bg }]}><MaterialIcons name={badge.icon} size={10} color={badge.color} /><Text style={{ color: badge.color, fontSize: 9, fontFamily: 'SpaceGrotesk_600SemiBold' }}>{badge.label}</Text></View>}
                                                    </View>
                                                    <Text style={styles.cardBrand}>{item.brand} · {item.serving}</Text>
                                                    <View style={styles.cardMacroPills}>
                                                        <Text style={styles.cardCalPill}>{Math.round(getDefMacro(item.calories))} kcal</Text>
                                                        <Text style={[styles.cardMacroPill, { color: '#3b82f6' }]}>P {getDefMacro(item.protein)}g</Text>
                                                        <Text style={[styles.cardMacroPill, { color: '#f59e0b' }]}>C {getDefMacro(item.carbs)}g</Text>
                                                        <Text style={[styles.cardMacroPill, { color: '#ef4444' }]}>F {getDefMacro(item.fat)}g</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.expandIcon}>
                                                    <MaterialIcons name={isExp ? 'expand-less' : 'chevron-right'} size={22} color={isExp ? colors.primary : colors.textMuted} />
                                                </View>
                                            </View>
                                            {isExp && (
                                                <View style={styles.expBody}>
                                                    <View style={styles.adjRow}>
                                                        <TouchableOpacity onPress={() => adjustQty(-1)} style={styles.adjBtn}><Text style={styles.adjText}>−</Text></TouchableOpacity>
                                                        <TextInput style={styles.adjInput} value={String(servingQty)} onChangeText={t => setServingQty(parseFloat(t) || 0)} keyboardType="decimal-pad" />
                                                        <TouchableOpacity onPress={() => adjustQty(1)} style={styles.adjBtn}><Text style={styles.adjText}>＋</Text></TouchableOpacity>
                                                        <TouchableOpacity onPress={() => setShowUnitPicker(!showUnitPicker)} style={styles.unitBtn}><Text style={styles.unitText}>{formatUnit(servingUnit)}</Text></TouchableOpacity>
                                                    </View>
                                                    {showUnitPicker && (
                                                        <View style={styles.unitGrid}>
                                                            {ALL_UNITS.map(u => (
                                                                <TouchableOpacity key={u} style={[styles.unitOpt, servingUnit === u && styles.unitOptAct]} onPress={() => changeUnit(u)}>
                                                                    <Text style={[styles.unitOptText, servingUnit === u && { color: colors.primary }]}>{formatUnit(u)}</Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <View style={styles.macroRow}>
                                                        <View style={styles.macroItem}><Text style={[styles.macroValue, { color: '#3b82f6' }]}>{Math.round(getScaled(item.protein))}g</Text><Text style={styles.macroLabel}>Protein</Text></View>
                                                        <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
                                                        <View style={styles.macroItem}><Text style={[styles.macroValue, { color: '#f59e0b' }]}>{Math.round(getScaled(item.carbs))}g</Text><Text style={styles.macroLabel}>Carbs</Text></View>
                                                        <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
                                                        <View style={styles.macroItem}><Text style={[styles.macroValue, { color: '#ef4444' }]}>{Math.round(getScaled(item.fat))}g</Text><Text style={styles.macroLabel}>Fat</Text></View>
                                                    </View>
                                                    <View style={styles.summary}>
                                                        <Text style={styles.totalCal}>{Math.round(getScaled(item.calories))} kcal</Text>
                                                        <TouchableOpacity style={styles.logBtn} onPress={() => handleLogFood(item)}><Text style={styles.logBtnText}>Log Food</Text></TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}

                                {showAiSearch && !searching && submittedQuery.length >= 2 && (
                                    <TouchableOpacity style={styles.aiBtn} onPress={handleAiSearch} disabled={aiSearching}>
                                        {aiSearching ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />}
                                        <Text style={styles.aiBtnText}>{aiSearching ? 'Asking AI...' : `Try AI for "${submittedQuery}"`}</Text>
                                    </TouchableOpacity>
                                )}
                                {hasSearched && !searching && results.length === 0 && submittedQuery.length >= 2 && (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.hintText}>No results for "{submittedQuery}"</Text>
                                        <Text style={styles.hintSubtext}>Try a broader term or use AI if you want estimated matches.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            <BarcodeScannerModal visible={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeResult} />
        </Modal>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', flex: 1 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    sheetTitle: { color: colors.text, fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold' },
    closeBtn: { color: colors.textMuted, fontSize: 18, width: 40 },
    doneBtn: { color: colors.primary, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 12, paddingLeft: 15, paddingRight: 10, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 15, paddingVertical: 12 },
    searchActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
    searchBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    camBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primaryMid },
    mealBadgeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 15 },
    mealBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    mealBadgeText: { color: colors.primary, fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    pillActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
    pillText: { color: colors.textMuted, fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
    dropdown: { position: 'absolute', top: 180, left: 20, zIndex: 10, backgroundColor: colors.bgCard, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.border, elevation: 5 },
    dropdownItem: { padding: 10 },
    dropdownText: { color: colors.text, fontSize: 14 },
    resultsList: { flex: 1, paddingHorizontal: 20 },
    sectionHeader: { color: colors.textSecondary, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 12, marginTop: 5 },
    queryBanner: { backgroundColor: colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    queryBannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    queryBannerLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.7, textTransform: 'uppercase' },
    queryBannerValue: { flex: 1, textAlign: 'right', color: colors.text, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    queryBannerHint: { color: colors.textMuted, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 6, lineHeight: 18 },
    loadingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    loadingText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
    matchSection: { marginBottom: 4 },
    compactRecentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    compactRecentName: { color: colors.text, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    compactRecentMeta: { color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 3 },
    compactRecentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.inputBg },
    compactRecentBadgeText: { color: colors.textSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
    recentMacroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    recentMacroPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    recentMacroText: { fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
    card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    cardExp: { borderColor: colors.primary + '60', backgroundColor: isDark ? colors.bgCard : colors.bgCard },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    cardName: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold', flexShrink: 1 },
    cardBrand: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontFamily: 'SpaceGrotesk_600SemiBold' },
    cardMacroPills: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    cardCalPill: { color: colors.primary, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    cardMacroPill: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', opacity: 0.85 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    expandIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    expBody: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border + '60', gap: 12 },
    adjRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    adjBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    adjText: { color: colors.text, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
    adjInput: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, color: colors.text, textAlign: 'center', paddingVertical: 10, fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', borderWidth: 1, borderColor: colors.border },
    unitBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    unitText: { color: colors.bgDark, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: colors.surface, padding: 10, borderRadius: 12 },
    unitOpt: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    unitOptAct: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
    unitOptText: { color: colors.text, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    macroRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8 },
    macroItem: { alignItems: 'center', flex: 1 },
    macroDivider: { width: 1, height: 28, opacity: 0.4 },
    macroValue: { fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold' },
    macroLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3, fontFamily: 'SpaceGrotesk_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalCal: { color: colors.primary, fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
    logBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    logBtnText: { color: colors.bgDark, fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },
    aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primaryDim, borderRadius: 12, paddingVertical: 14, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary + '40', marginVertical: 10 },
    aiBtnText: { color: colors.primary, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    savedCard: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    recipeSheet: { paddingBottom: 12 },
    recipeSheetTitle: { color: colors.text, fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 4 },
    recipeSheetSubtitle: { color: colors.textSecondary, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 14, lineHeight: 18 },
    inlineSection: { marginBottom: 16 },
    inlineSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
    inlineSectionTitle: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
    inlineSectionSubtitle: { color: colors.textMuted, fontSize: 11, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 2, lineHeight: 16, maxWidth: 220 },
    inlineCreateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    inlineCreateBtnText: { color: colors.bgDark, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },
    createMealBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
        borderRadius: 14,
        paddingVertical: 14,
        borderStyle: 'dashed',
    },
    createMealBtnText: { color: colors.primary, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },
    recipeCard: {
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recipeHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    recipeName: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 6 },
    recipeTagRow: { flexDirection: 'row', gap: 6 },
    recipeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    recipeTagText: { color: colors.textSecondary, fontSize: 9, fontFamily: 'SpaceGrotesk_600SemiBold' },
    recipeTagHighlight: { backgroundColor: colors.primaryDim },
    recipeTagTextHighlight: { color: colors.primary, fontSize: 9, fontFamily: 'SpaceGrotesk_700Bold' },
    recipeCal: { color: colors.text, fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', marginLeft: 8 },
    recipeCalUnit: { color: colors.textMuted, fontSize: 10, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 4 },
    recipeMacros: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
    macroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    macroBadgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
    recipeBody: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    recipeMetaPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primaryDim, marginBottom: 12 },
    recipeMetaText: { color: colors.primary, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },
    recipeExpanded: { marginTop: 14 },
    recipeSection: { marginBottom: 12 },
    recipeSectionTitle: { color: colors.text, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 1, marginBottom: 6 },
    recipeLineText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', lineHeight: 18, marginBottom: 4 },
    ingredientRow: { flexDirection: 'row', paddingVertical: 3 },
    ingredientBullet: { color: colors.primary, fontSize: 12, width: 12 },
    ingredientText: { color: colors.text, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', flex: 1, lineHeight: 18 },
    stepRow: { flexDirection: 'row', paddingVertical: 4, gap: 8 },
    stepNum: { width: 20, height: 20, borderRadius: 6, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
    stepNumText: { color: colors.primary, fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold' },
    stepText: { color: colors.text, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', flex: 1, lineHeight: 18 },
    recipeActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    addRecipeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.primary,
    },
    addRecipeBtnText: { color: colors.bgDark, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
    addBtnText: { color: colors.bgDark, fontSize: 12, fontFamily: 'SpaceGrotesk_700Bold' },
    center: { padding: 40, alignItems: 'center' },
    statusCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    statusTitle: { color: colors.text, fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
    statusText: { color: colors.textMuted, fontSize: 12, fontFamily: 'SpaceGrotesk_500Medium', marginTop: 4, lineHeight: 18 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    hintText: { color: colors.text, fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold', textAlign: 'center' },
    hintSubtext: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
});
