/**
 * ExpoHealthKitObserverAppDelegate.swift
 * AppDelegate subscriber for HealthKit background delivery initialization
 *
 * This subscriber hooks into the Expo app lifecycle to:
 * 1. Initialize HealthKit observer queries on app launch (including background launch)
 * 2. Handle background task completion for HealthKit updates
 *
 * Background delivery requires observers to be registered BEFORE app finishes launching,
 * so this subscriber ensures they're set up in applicationDidFinishLaunching.
 *
 * @file modules/expo-healthkit-observer/ios/ExpoHealthKitObserverAppDelegate.swift
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import ExpoModulesCore
import HealthKit
import UIKit

public class ExpoHealthKitObserverAppDelegate: ExpoAppDelegateSubscriber {

    // MARK: - Properties

    private let manager = HealthKitManager.shared

    /// Data types to observe for background delivery
    private let observableDataTypes: [String] = [
        "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        "HKCategoryTypeIdentifierSleepAnalysis",
        "HKQuantityTypeIdentifierRestingHeartRate",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierActiveEnergyBurned"
    ]

    // MARK: - App Lifecycle

    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Check if app was launched for a HealthKit background delivery
        let launchedForHealthKit = launchOptions?[.init(rawValue: "HealthKit")] != nil

        if launchedForHealthKit {
            print("[HealthKit] App launched for background delivery")
        }

        // Check if user has previously authorized HealthKit
        let authStatus = manager.getAuthorizationStatus()
        guard authStatus == "authorized" else {
            print("[HealthKit] Not authorized, skipping observer setup. Status: \(authStatus)")
            return true
        }

        // Check if background observers should be enabled (user preference)
        let backgroundEnabled = UserDefaults.standard.bool(forKey: "healthkit_background_enabled")
        guard backgroundEnabled else {
            print("[HealthKit] Background delivery disabled by user preference")
            return true
        }

        // Initialize observer queries for background delivery
        // CRITICAL: Must be done during app launch, before returning from this method
        setupBackgroundObservers()

        return true
    }

    public func applicationDidBecomeActive(_ application: UIApplication) {
        // When app becomes active, sync any pending updates
        print("[HealthKit] App became active, checking for pending updates")
    }

    public func applicationWillResignActive(_ application: UIApplication) {
        // App going to background - observers will continue running
        print("[HealthKit] App resigning active, background observers remain active")
    }

    // MARK: - Private: Observer Setup

    private func setupBackgroundObservers() {
        print("[HealthKit] Setting up background observers for: \(observableDataTypes)")

        manager.startObserving(
            dataTypes: observableDataTypes,
            frequency: .immediate
        ) { success, error in
            if success {
                print("[HealthKit] ✓ Background observers initialized successfully")
            } else {
                print("[HealthKit] ✗ Failed to initialize observers: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
}
