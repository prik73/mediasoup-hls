import { useState, useRef, useEffect } from 'react';

interface DeviceSelectorProps {
    devices: Array<{ deviceId: string; label: string }>;
    selectedDeviceId: string;
    onSelectDevice: (deviceId: string) => void;
    icon: React.ReactNode;
    label: string;
}

/**
 * Dropdown selector for media devices (camera/microphone)
 */
export function DeviceSelector({
    devices,
    selectedDeviceId,
    onSelectDevice,
    icon,
    label,
}: DeviceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (devices.length <= 1) {
        // Don't show selector if only one device
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
                title={`Select ${label}`}
                type="button"
            >
                <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {icon}
                            <span>{label}</span>
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {devices.map((device) => (
                            <button
                                key={device.deviceId}
                                onClick={() => {
                                    onSelectDevice(device.deviceId);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${device.deviceId === selectedDeviceId
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                type="button"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="truncate">{device.label || `${label} ${device.deviceId.slice(0, 8)}`}</span>
                                    {device.deviceId === selectedDeviceId && (
                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
