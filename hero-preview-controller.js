export function createHeroPreviewController(screenOrder) {
    const orderedScreens = Array.isArray(screenOrder) ? [...screenOrder] : [];
    const scrollPositions = new Map(orderedScreens.map((screenId) => [screenId, 0]));
    let activeIndex = 0;
    let autoRotateEnabled = true;

    const findScreenIndex = (screenId) => orderedScreens.indexOf(screenId);

    return {
        getActiveScreen() {
            return orderedScreens[activeIndex] || null;
        },
        getScreenOrder() {
            return [...orderedScreens];
        },
        isAutoRotateEnabled() {
            return autoRotateEnabled;
        },
        advance() {
            if (!autoRotateEnabled || orderedScreens.length === 0) {
                return this.getActiveScreen();
            }

            activeIndex = (activeIndex + 1) % orderedScreens.length;
            return this.getActiveScreen();
        },
        select(screenId) {
            const nextIndex = findScreenIndex(screenId);

            if (nextIndex >= 0) {
                activeIndex = nextIndex;
            }

            return this.getActiveScreen();
        },
        recordInteraction() {
            autoRotateEnabled = false;
            return autoRotateEnabled;
        },
        setScrollPosition(screenId, position) {
            if (scrollPositions.has(screenId)) {
                scrollPositions.set(screenId, Math.max(0, Number(position) || 0));
            }

            return this.getScrollPosition(screenId);
        },
        getScrollPosition(screenId) {
            return scrollPositions.get(screenId) ?? 0;
        },
    };
}
