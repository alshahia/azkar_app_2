
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { ArrowLeftIcon, MapPinIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { MosqueIcon } from '../common/CustomIcons';
import { HapticService } from '../../services/HapticService';

const QiblaCompassScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const location = usePreferencesStore((state) => state.location);
    const setLocation = usePreferencesStore((state) => state.setLocation);
    const [heading, setHeading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
    const lastHapticRef = useRef<number>(0);

    const fetchCurrentLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        try {
            const loc = await PrayerTimesService.getCurrentLocation();
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                setLocation(loc);
                setError(null);
            } else {
                throw new Error("INVALID_COORDINATES");
            }
        } catch (e) {
            console.error("Error fetching location for Qibla:", e);
            setError("يرجى تفعيل خدمة الموقع لتحديد اتجاه القبلة بدقة");
        } finally {
            setIsLoadingLocation(false);
        }
    }, [setLocation]);

    // 1. Qibla bearing for the stored location. getQiblaDirection returns 0 for
    // a missing/invalid location, so this is pure and belongs in render.
    const qiblaDirection = useMemo(
        () => PrayerTimesService.getQiblaDirection(location),
        [location]
    );

    // Ask for a location when we have none. A successful fetch clears any
    // previous error itself, so there is no error state to reset here.
    const hasValidLocation = location && typeof location.latitude === 'number' && typeof location.longitude === 'number';

    useEffect(() => {
        if (hasValidLocation) return;
        // Deferred a tick: the fetch sets its loading flag immediately, and a
        // synchronous setState in an effect body would cascade renders.
        const timer = setTimeout(() => { void fetchCurrentLocation(); }, 0);
        return () => clearTimeout(timer);
    }, [hasValidLocation, fetchCurrentLocation]);

    // 2. Handle Device Orientation (iOS + Android)
    const hasDeviceOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const needsPermission =
        hasDeviceOrientation &&
        typeof (window as any).DeviceOrientationEvent?.requestPermission === 'function';

    // Platforms without a permission gate start out ready to use.
    const [permissionGranted, setPermissionGranted] = useState<boolean>(() => !needsPermission);

    const handleOrientation = useCallback((event: Event) => {
        const orientation = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
        let compass = 0;
        // Check for iOS 'webkitCompassHeading' property
        if (typeof orientation.webkitCompassHeading === 'number') {
            compass = orientation.webkitCompassHeading;
        } else if (typeof orientation.alpha === 'number') {
            // Android / Standard (alpha is degrees from North)
            compass = (360 - orientation.alpha) % 360;
        }

        if (!isNaN(compass)) {
            setHeading(compass);
        }
    }, []);

    // One owner for the listener: it is attached when the sensor is usable and
    // always removed on cleanup, so no anonymous listener can outlive the screen.
    useEffect(() => {
        if (!hasDeviceOrientation) return;

        if (!needsPermission) {
            // Android Chrome prefers deviceorientationabsolute
            window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
            return () => {
                window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
                window.removeEventListener('deviceorientation', handleOrientation, true);
            };
        }

        if (permissionGranted) {
            // iOS: listeners attach only once the user grants sensor access
            window.addEventListener('deviceorientation', handleOrientation, true);
            return () => window.removeEventListener('deviceorientation', handleOrientation, true);
        }
    }, [hasDeviceOrientation, needsPermission, permissionGranted, handleOrientation]);

    const requestOrientationPermission = () => {
        if (typeof (window as any).DeviceOrientationEvent?.requestPermission === 'function') {
            (window as any).DeviceOrientationEvent.requestPermission()
                .then((response: string) => {
                    if (response === 'granted') {
                        // The effect above owns the listener; only flip the flag.
                        setPermissionGranted(true);
                    } else {
                        setError('تم رفض إذن الوصول للحساسات');
                    }
                })
                .catch(console.error);
        }
    };

    // Calculate rotation
    const dialRotation = heading !== null ? -heading : 0;
    // Wrap-aware alignment: measure the short way round the circle, so 358° and
    // 2° count as 4° apart instead of 356°.
    const headingDelta = heading !== null ? (heading - qiblaDirection + 360) % 360 : null;
    const isAligned = headingDelta !== null && Math.min(headingDelta, 360 - headingDelta) < 5;

    // Haptic feedback on alignment (debounced)
    useEffect(() => {
        if (isAligned) {
            const now = Date.now();
            if (now - lastHapticRef.current > 1500) {
                lastHapticRef.current = now;
                HapticService.light();
            }
        }
    }, [isAligned]);

    const hasPermissionRequestButton = !permissionGranted && needsPermission;

    return (
        <div className="h-full flex flex-col bg-surface dark:bg-surface">
            <header className="flex items-center justify-between p-4 z-10">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 bg-surface-card/50 dark:bg-black/20 rounded-full backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-black/40">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white">القبلة</h1>
                <div className="w-10"></div>
            </header>

            <div className="flex-grow flex flex-col items-center justify-center p-6 relative">
                
                {/* Permission Request for iOS */}
                {hasPermissionRequestButton && (
                    <div className="absolute top-12 z-20 text-center">
                        <button 
                            onClick={requestOrientationPermission}
                            className="bg-primary-500 text-white px-6 py-3 rounded-full font-bold active:scale-95 transition-transform"
                        >
                            تفعيل البوصلة
                        </button>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">مطلوب إذن الوصول للحساسات لتحديد الاتجاه</p>
                    </div>
                )}

                {/* Error Banner — quiet neutral surface, retry stays the primary action */}
                {error && (
                    <div className="bg-surface-card-2 dark:bg-midnight-800/40 text-gray-600 dark:text-gray-300 p-4 rounded-xl text-center mb-6 flex flex-col items-center max-w-xs space-y-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button 
                            onClick={fetchCurrentLocation}
                            disabled={isLoadingLocation}
                            className="text-xs bg-primary-600 text-white px-4 py-2.5 min-h-10 rounded-lg flex items-center space-x-1 rtl:space-x-reverse font-bold hover:bg-primary-500 disabled:opacity-60"
                        >
                            <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                            <span>إعادة المحاولة</span>
                        </button>
                    </div>
                )}

                {isLoadingLocation && !error && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 animate-pulse">
                        جاري تحديد موقعك...
                    </p>
                )}

                {!hasDeviceOrientation && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                        البوصلة غير مدعومة على هذا الجهاز
                    </p>
                )}

                {!heading && !error && !isLoadingLocation && permissionGranted && hasDeviceOrientation && (
                     <div className="text-center text-gray-500 dark:text-gray-400 mb-6 animate-pulse">
                        <p>جاري معايرة البوصلة...</p>
                        <p className="text-xs mt-1">حرك الهاتف على شكل رقم 8</p>
                    </div>
                )}

                {/* Compass Container — fluid width so it never overflows a 320px screen */}
                <div className="relative w-full max-w-72 md:max-w-80 aspect-square flex items-center justify-center">
                    
                    {/* Fixed Indicator Arrow */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 text-primary-500">
                        <div className="w-1 h-4 bg-primary-500 rounded-full mx-auto mb-1"></div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-500"></div>
                    </div>

                    {/* Rotating Dial */}
                    <div 
                        className="w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700 bg-surface-card dark:bg-surface-card shadow-2xl dark:shadow-none relative transition-transform duration-300 ease-out flex items-center justify-center"
                        style={{ transform: `rotate(${dialRotation}deg)` }}
                    >
                        {/* North Indicator */}
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-primary-500 font-bold text-xl">N</div>
                        
                        {/* Compass Marks */}
                        <div className="absolute inset-0 rounded-full border border-surface-card-2 dark:border-midnight-800 opacity-50 m-4"></div>
                        <div className="absolute top-1/2 left-2 right-2 h-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="absolute left-1/2 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
                        
                        {/* Cardinal Points */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-500 dark:text-gray-400 font-bold">S</div>
                        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">E</div>
                        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">W</div>

                        {/* Qibla Pointer */}
                        <div 
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ transform: `rotate(${qiblaDirection}deg)` }}
                        >
                            {/* The pointer line */}
                            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-16 bg-primary-500/30 rounded-full"></div>
                            
                            {/* The Kaaba Icon/Marker */}
                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white p-2 rounded-lg shadow-lg dark:shadow-none">
                                <MosqueIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Center Point */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-900 z-10"></div>
                    </div>

                    {/* Success indicator when aligned */}
                    {isAligned && (
                        <div className="absolute inset-0 rounded-full border-4 border-primary-500 opacity-60 animate-ping z-0 pointer-events-none"></div>
                    )}
                </div>

                <div className="mt-10 text-center">
                    <div className="bg-surface-card dark:bg-surface-card px-6 py-4 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-midnight-800 inline-flex items-center space-x-4 rtl:space-x-reverse">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-serif">زاوية القبلة</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white font-mono">{Math.round(qiblaDirection)}°</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                         <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-serif">اتجاه الهاتف</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white font-mono">{heading !== null ? Math.round(heading) : '--'}°</p>
                        </div>
                    </div>
                    {hasValidLocation && (
                         <div className="mt-4 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                             <MapPinIcon className="w-3 h-3 ml-1" />
                             <span>{location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</span>
                         </div>
                    )}
                </div>
            </div>
            
            <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
               لضمان الدقة، يرجى الابتعاد عن الأجسام المغناطيسية
            </div>
        </div>
    );
};

export default QiblaCompassScreen;
