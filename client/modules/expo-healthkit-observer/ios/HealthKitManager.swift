/**
 * HealthKitManager.swift
 * Core business logic for HealthKit integration with background delivery
 *
 * Key implementation details (from Perplexity research):
 * - completionHandler() MUST be called within 2 seconds to avoid 3-strike backoff
 * - Use .utility QoS queue for battery optimization
 * - Apple HealthKit uses SDNN for HRV, NOT RMSSD (cannot compare to Oura directly)
 *
 * @file modules/expo-healthkit-observer/ios/HealthKitManager.swift
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import HealthKit
import Foundation
import UIKit

// MARK: - Delegate Protocol

protocol HealthKitManagerDelegate: AnyObject {
    func healthKitManager(_ manager: HealthKitManager, didReceiveUpdate data: [String: Any])
    func healthKitManager(_ manager: HealthKitManager, didEncounterError error: Error)
}

// MARK: - HealthKitManager

final class HealthKitManager {

    // MARK: - Singleton

    static let shared = HealthKitManager()

    // MARK: - Properties

    weak var delegate: HealthKitManagerDelegate?

    private let healthStore = HKHealthStore()
    private var observerQueries: [String: HKObserverQuery] = [:]
    private var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid

    /// Processing queue with low priority for battery optimization
    private let processingQueue = DispatchQueue(
        label: "com.apexos.healthkit-processing",
        qos: .utility
    )

    /// Pending updates cached locally (network sync happens on foreground)
    private var pendingUpdates: [[String: Any]] = []

    // MARK: - Supported Health Types (Safe Initialization)

    /// Safely initialized readable types - filters out any nil values
    /// Uses computed property to avoid force unwrap crash at module load time
    private static var readableTypes: [HKSampleType] {
        return [
            HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis),
            HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKQuantityType.quantityType(forIdentifier: .heartRate)
        ].compactMap { $0 }
    }

    /// Safely initialized observable types dictionary - filters out nil values
    /// Uses computed property to avoid force unwrap crash at module load time
    private static var observableTypes: [String: HKSampleType] {
        var types: [String: HKSampleType] = [:]
        if let type = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            types["HKQuantityTypeIdentifierHeartRateVariabilitySDNN"] = type
        }
        if let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            types["HKCategoryTypeIdentifierSleepAnalysis"] = type
        }
        if let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            types["HKQuantityTypeIdentifierRestingHeartRate"] = type
        }
        if let type = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            types["HKQuantityTypeIdentifierStepCount"] = type
        }
        if let type = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            types["HKQuantityTypeIdentifierActiveEnergyBurned"] = type
        }
        return types
    }

    // MARK: - Initialization

    private init() {}

    // MARK: - Public API

    /// Check if HealthKit is available on this device
    func isAvailable() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }

    /// Request authorization for health data access
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            let error = NSError(
                domain: "HealthKit",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "HealthKit is not available on this device"]
            )
            completion(false, error)
            return
        }

        let toRead = Set(Self.readableTypes)

        // iOS 18+: Use new authorization API with fallback
        if #available(iOS 18.0, *) {
            healthStore.requestAuthorization(toShare: nil, read: toRead) { success, error in
                DispatchQueue.main.async {
                    completion(success, error)
                }
            }
        } else {
            healthStore.requestAuthorization(toShare: nil, read: toRead) { success, error in
                DispatchQueue.main.async {
                    completion(success, error)
                }
            }
        }
    }

    /// Get current authorization status
    func getAuthorizationStatus() -> String {
        guard HKHealthStore.isHealthDataAvailable() else {
            return "unavailable"
        }

        // Check if we have authorization for at least HRV
        if let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            let status = healthStore.authorizationStatus(for: hrvType)
            switch status {
            case .sharingAuthorized:
                return "authorized"
            case .sharingDenied:
                return "denied"
            case .notDetermined:
                return "notDetermined"
            @unknown default:
                return "unknown"
            }
        }

        return "unknown"
    }

    /// Start observing health data types with background delivery
    func startObserving(
        dataTypes: [String],
        frequency: HKUpdateFrequency,
        completion: @escaping (Bool, Error?) -> Void
    ) {
        beginBackgroundTask()

        var enabledCount = 0
        var errorOccurred: Error?
        let totalTypes = dataTypes.count

        for dataTypeID in dataTypes {
            guard let sampleType = Self.observableTypes[dataTypeID] else {
                print("[HealthKit] Warning: Unknown type \(dataTypeID)")
                enabledCount += 1
                checkCompletion(enabledCount, totalTypes, errorOccurred, completion)
                continue
            }

            // Create observer query with completion handler
            let updateHandler: (HKObserverQuery, @escaping HKObserverQueryCompletionHandler, Error?) -> Void = { [weak self] query, queryCompletion, error in
                self?.handleObserverUpdate(
                    sampleType: sampleType,
                    typeIdentifier: dataTypeID,
                    completion: queryCompletion,
                    error: error
                )
            }

            let observerQuery = HKObserverQuery(
                sampleType: sampleType,
                predicate: nil,
                updateHandler: updateHandler
            )

            // Store and execute observer query
            observerQueries[dataTypeID] = observerQuery
            healthStore.execute(observerQuery)

            // Enable background delivery
            healthStore.enableBackgroundDelivery(for: sampleType, frequency: frequency) { [weak self] success, error in
                if success {
                    print("[HealthKit] Background delivery enabled for \(dataTypeID)")
                    enabledCount += 1
                } else {
                    print("[HealthKit] Failed to enable background delivery for \(dataTypeID): \(error?.localizedDescription ?? "Unknown")")
                    errorOccurred = error
                    enabledCount += 1
                }

                self?.checkCompletion(enabledCount, totalTypes, errorOccurred, completion)
            }
        }
    }

    /// Stop all observer queries
    func stopAllObservers() {
        for (typeID, query) in observerQueries {
            healthStore.stop(query)
            print("[HealthKit] Stopped observer for \(typeID)")
        }
        observerQueries.removeAll()
    }

    /// Manually fetch latest data for all types
    func syncNow(completion: @escaping ([[String: Any]], Error?) -> Void) {
        var allReadings: [[String: Any]] = []
        let group = DispatchGroup()
        var syncError: Error?

        // Fetch HRV
        group.enter()
        fetchLatestHRV { readings, error in
            if let readings = readings {
                allReadings.append(contentsOf: readings)
            }
            if error != nil { syncError = error }
            group.leave()
        }

        // Fetch Sleep
        group.enter()
        fetchLatestSleep { readings, error in
            if let readings = readings {
                allReadings.append(contentsOf: readings)
            }
            if error != nil { syncError = error }
            group.leave()
        }

        // Fetch RHR
        group.enter()
        fetchLatestRHR { readings, error in
            if let readings = readings {
                allReadings.append(contentsOf: readings)
            }
            if error != nil { syncError = error }
            group.leave()
        }

        // Fetch Steps
        group.enter()
        fetchLatestSteps { readings, error in
            if let readings = readings {
                allReadings.append(contentsOf: readings)
            }
            if error != nil { syncError = error }
            group.leave()
        }

        // Fetch Active Energy
        group.enter()
        fetchLatestActiveEnergy { readings, error in
            if let readings = readings {
                allReadings.append(contentsOf: readings)
            }
            if error != nil { syncError = error }
            group.leave()
        }

        group.notify(queue: .main) {
            completion(allReadings, syncError)
        }
    }

    // MARK: - Private: Observer Update Handler

    /// CRITICAL: Must complete within 2 seconds to avoid 3-strike backoff
    private func handleObserverUpdate(
        sampleType: HKSampleType,
        typeIdentifier: String,
        completion: @escaping HKObserverQueryCompletionHandler,
        error: Error?
    ) {
        guard error == nil else {
            print("[HealthKit] Observer error for \(typeIdentifier): \(error?.localizedDescription ?? "Unknown error")")
            completion()
            return
        }

        processingQueue.async { [weak self] in
            let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

            let query = HKSampleQuery(
                sampleType: sampleType,
                predicate: nil,
                limit: 5,
                sortDescriptors: [sortDescriptor]
            ) { [weak self] _, samples, queryError in
                guard let self = self else {
                    completion()
                    return
                }

                if let samples = samples, !samples.isEmpty {
                    let readings = samples.compactMap { self.sampleToReading($0, typeIdentifier: typeIdentifier) }

                    // Cache locally for batch sync
                    self.pendingUpdates.append(contentsOf: readings)

                    // Notify delegate
                    if let latest = readings.first {
                        DispatchQueue.main.async {
                            self.delegate?.healthKitManager(self, didReceiveUpdate: latest)
                        }
                    }

                    // Store last update timestamp
                    UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "lastHealthKitUpdate_\(typeIdentifier)")
                }

                // CRITICAL: Call completion IMMEDIATELY after processing
                completion()
            }

            self?.healthStore.execute(query)
        }
    }

    // MARK: - Private: Fetch Methods

    private func fetchLatestHRV(completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            completion(nil, nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: hrvType,
            predicate: predicate,
            limit: 10,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            guard let samples = samples as? [HKQuantitySample] else {
                completion(nil, error)
                return
            }

            let readings = samples.map { sample -> [String: Any] in
                return [
                    "metric": "hrv",
                    "value": sample.quantity.doubleValue(for: .secondUnit(with: .milli)),
                    "unit": "ms",
                    "hrvMethod": "sdnn",  // Apple uses SDNN, NOT RMSSD
                    "startDate": sample.startDate.timeIntervalSince1970 * 1000,
                    "endDate": sample.endDate.timeIntervalSince1970 * 1000,
                    "source": sample.sourceRevision.source.name
                ]
            }

            completion(readings, nil)
        }

        healthStore.execute(query)
    }

    private func fetchLatestSleep(completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion(nil, nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: sleepType,
            predicate: predicate,
            limit: 50,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            guard let samples = samples as? [HKCategorySample] else {
                completion(nil, error)
                return
            }

            let readings = samples.map { sample -> [String: Any] in
                let durationMinutes = sample.endDate.timeIntervalSince(sample.startDate) / 60
                let sleepStage = self.sleepValueToStage(sample.value)

                return [
                    "metric": "sleep",
                    "value": durationMinutes,
                    "unit": "minute",
                    "sleepStage": sleepStage,
                    "startDate": sample.startDate.timeIntervalSince1970 * 1000,
                    "endDate": sample.endDate.timeIntervalSince1970 * 1000,
                    "source": sample.sourceRevision.source.name
                ]
            }

            completion(readings, nil)
        }

        healthStore.execute(query)
    }

    private func fetchLatestRHR(completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let rhrType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else {
            completion(nil, nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: rhrType,
            predicate: predicate,
            limit: 10,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            guard let samples = samples as? [HKQuantitySample] else {
                completion(nil, error)
                return
            }

            let readings = samples.map { sample -> [String: Any] in
                return [
                    "metric": "rhr",
                    "value": sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())),
                    "unit": "bpm",
                    "startDate": sample.startDate.timeIntervalSince1970 * 1000,
                    "endDate": sample.endDate.timeIntervalSince1970 * 1000,
                    "source": sample.sourceRevision.source.name
                ]
            }

            completion(readings, nil)
        }

        healthStore.execute(query)
    }

    private func fetchLatestSteps(completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            completion(nil, nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: stepsType,
            predicate: predicate,
            limit: 50,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            guard let samples = samples as? [HKQuantitySample] else {
                completion(nil, error)
                return
            }

            let readings = samples.map { sample -> [String: Any] in
                return [
                    "metric": "steps",
                    "value": sample.quantity.doubleValue(for: .count()),
                    "unit": "count",
                    "startDate": sample.startDate.timeIntervalSince1970 * 1000,
                    "endDate": sample.endDate.timeIntervalSince1970 * 1000,
                    "source": sample.sourceRevision.source.name
                ]
            }

            completion(readings, nil)
        }

        healthStore.execute(query)
    }

    private func fetchLatestActiveEnergy(completion: @escaping ([[String: Any]]?, Error?) -> Void) {
        guard let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            completion(nil, nil)
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: Date().addingTimeInterval(-86400), end: Date(), options: .strictEndDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)

        let query = HKSampleQuery(
            sampleType: activeEnergyType,
            predicate: predicate,
            limit: 50,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            guard let samples = samples as? [HKQuantitySample] else {
                completion(nil, error)
                return
            }

            let readings = samples.map { sample -> [String: Any] in
                return [
                    "metric": "activeCalories",
                    "value": sample.quantity.doubleValue(for: .kilocalorie()),
                    "unit": "kcal",
                    "startDate": sample.startDate.timeIntervalSince1970 * 1000,
                    "endDate": sample.endDate.timeIntervalSince1970 * 1000,
                    "source": sample.sourceRevision.source.name
                ]
            }

            completion(readings, nil)
        }

        healthStore.execute(query)
    }

    // MARK: - Private: Helpers

    private func sampleToReading(_ sample: HKSample, typeIdentifier: String) -> [String: Any]? {
        var reading: [String: Any] = [
            "startDate": sample.startDate.timeIntervalSince1970 * 1000,
            "endDate": sample.endDate.timeIntervalSince1970 * 1000,
            "source": sample.sourceRevision.source.name
        ]

        if let quantity = sample as? HKQuantitySample {
            switch typeIdentifier {
            case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
                reading["metric"] = "hrv"
                reading["value"] = quantity.quantity.doubleValue(for: .secondUnit(with: .milli))
                reading["unit"] = "ms"
                reading["hrvMethod"] = "sdnn"
            case "HKQuantityTypeIdentifierRestingHeartRate":
                reading["metric"] = "rhr"
                reading["value"] = quantity.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                reading["unit"] = "bpm"
            case "HKQuantityTypeIdentifierStepCount":
                reading["metric"] = "steps"
                reading["value"] = quantity.quantity.doubleValue(for: .count())
                reading["unit"] = "count"
            case "HKQuantityTypeIdentifierActiveEnergyBurned":
                reading["metric"] = "activeCalories"
                reading["value"] = quantity.quantity.doubleValue(for: .kilocalorie())
                reading["unit"] = "kcal"
            default:
                return nil
            }
        } else if let category = sample as? HKCategorySample {
            if typeIdentifier == "HKCategoryTypeIdentifierSleepAnalysis" {
                let durationMinutes = sample.endDate.timeIntervalSince(sample.startDate) / 60
                reading["metric"] = "sleep"
                reading["value"] = durationMinutes
                reading["unit"] = "minute"
                reading["sleepStage"] = sleepValueToStage(category.value)
            }
        }

        return reading
    }

    private func sleepValueToStage(_ value: Int) -> String {
        // HKCategoryValueSleepAnalysis values
        switch value {
        case 0: return "inBed"
        case 1: return "asleepUnspecified"
        case 2: return "awake"
        case 3: return "asleepCore"     // Light sleep
        case 4: return "asleepDeep"
        case 5: return "asleepREM"
        default: return "unknown"
        }
    }

    private func checkCompletion(
        _ current: Int,
        _ total: Int,
        _ error: Error?,
        _ completion: @escaping (Bool, Error?) -> Void
    ) {
        if current >= total {
            endBackgroundTask()
            DispatchQueue.main.async {
                completion(error == nil, error)
            }
        }
    }

    // MARK: - Private: Background Task Management

    private func beginBackgroundTask() {
        backgroundTaskID = UIApplication.shared.beginBackgroundTask(withName: "HealthKitObserver") { [weak self] in
            self?.endBackgroundTask()
        }
    }

    private func endBackgroundTask() {
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }
}
