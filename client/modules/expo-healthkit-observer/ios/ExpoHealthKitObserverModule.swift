/**
 * ExpoHealthKitObserverModule.swift
 * Expo Modules API bridge for HealthKit integration
 *
 * Exposes native HealthKit functionality to React Native via:
 * - AsyncFunction for async operations (requestAuthorization, startObserving, syncNow)
 * - Events for real-time health data updates
 * - Property for checking availability
 *
 * @file modules/expo-healthkit-observer/ios/ExpoHealthKitObserverModule.swift
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import ExpoModulesCore
import HealthKit

public class ExpoHealthKitObserverModule: Module {

    // MARK: - Properties

    /// Lazy initialization to prevent crashes during module load
    /// The manager is only created when first accessed, not at class instantiation
    private lazy var manager: HealthKitManager = {
        return HealthKitManager.shared
    }()

    // MARK: - Module Definition

    public func definition() -> ModuleDefinition {
        Name("ExpoHealthKitObserver")

        // Define events that can be sent to JavaScript
        Events("onHealthKitDataUpdate", "onSyncComplete", "onError")

        // Check if HealthKit is available
        Function("isAvailable") { () -> Bool in
            return self.manager.isAvailable()
        }

        // Get current authorization status
        Function("getAuthorizationStatus") { () -> String in
            return self.manager.getAuthorizationStatus()
        }

        // Request HealthKit authorization
        AsyncFunction("requestAuthorization") { (promise: Promise) in
            self.manager.requestAuthorization { success, error in
                if let error = error {
                    promise.reject(
                        ExpoModulesCore.Exception(
                            name: "AuthorizationError",
                            description: error.localizedDescription
                        )
                    )
                } else {
                    promise.resolve(success)
                }
            }
        }

        // Start observing health data with background delivery
        AsyncFunction("startObserving") { (dataTypes: [String], frequency: String, promise: Promise) in
            let hkFrequency = self.parseFrequency(frequency)

            self.manager.startObserving(dataTypes: dataTypes, frequency: hkFrequency) { success, error in
                if let error = error {
                    promise.reject(
                        ExpoModulesCore.Exception(
                            name: "ObserverError",
                            description: error.localizedDescription
                        )
                    )
                } else {
                    promise.resolve(success)
                }
            }
        }

        // Stop all observer queries
        Function("stopObserving") { () in
            self.manager.stopAllObservers()
        }

        // Manually trigger a sync
        AsyncFunction("syncNow") { (promise: Promise) in
            self.manager.syncNow { readings, error in
                if let error = error {
                    promise.reject(
                        ExpoModulesCore.Exception(
                            name: "SyncError",
                            description: error.localizedDescription
                        )
                    )
                } else {
                    // Convert readings to JSON-safe format
                    let jsonReadings = readings.map { reading -> [String: Any] in
                        var jsonReading = reading
                        // Ensure all values are JSON-serializable
                        return jsonReading
                    }
                    promise.resolve(jsonReadings)
                }
            }
        }

        // Get last sync timestamp for a specific type
        Function("getLastSyncTimestamp") { (dataType: String) -> Double? in
            return UserDefaults.standard.double(forKey: "lastHealthKitUpdate_\(dataType)")
        }

        // Module lifecycle: Set up delegate when module is created
        OnCreate {
            self.setupDelegate()
        }

        // Clean up when module is destroyed
        OnDestroy {
            self.manager.stopAllObservers()
        }
    }

    // MARK: - Private Helpers

    private func parseFrequency(_ frequency: String) -> HKUpdateFrequency {
        switch frequency.lowercased() {
        case "immediate":
            return .immediate
        case "hourly":
            return .hourly
        case "daily":
            return .daily
        default:
            return .immediate
        }
    }

    private func setupDelegate() {
        manager.delegate = self
    }
}

// MARK: - HealthKitManagerDelegate

extension ExpoHealthKitObserverModule: HealthKitManagerDelegate {

    func healthKitManager(_ manager: HealthKitManager, didReceiveUpdate data: [String: Any]) {
        // Send event to JavaScript
        sendEvent("onHealthKitDataUpdate", data)
    }

    func healthKitManager(_ manager: HealthKitManager, didEncounterError error: Error) {
        sendEvent("onError", [
            "message": error.localizedDescription
        ])
    }
}
