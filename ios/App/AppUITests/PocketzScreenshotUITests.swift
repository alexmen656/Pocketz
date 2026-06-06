//
//  PocketzScreenshotUITests.swift
//  AppUITests
//
//  Automated App Store screenshots for the Pocketz Capacitor app.
//
//  Pocketz renders inside a WKWebView, so instead of tapping native controls we
//  drive it through launch-argument flags that the web app reads via Capacitor
//  Preferences (`-CapacitorStorage.<key> <value>` lands in UserDefaults):
//
//    ui_test_mode        "1"      seed deterministic demo cards (see uiTestMode.ts)
//    ui_test_start_route "/path"  navigate straight to the screen to capture
//    ui_test_open_card   "1"      auto-open the first card's barcode detail on home
//
//  Each test launches fresh at one route and captures one screenshot — no
//  in-web-view navigation, which keeps the run fast and stable across languages.
//

import XCTest

@MainActor
final class PocketzScreenshotUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    /// Launches the app straight onto `route` with demo cards seeded.
    /// `openCard` opens the first card's barcode detail (home route only).
    /// `settle` gives the web view time to render and load logos over the network.
    private func launch(route: String, openCard: Bool = false, settle: TimeInterval = 3.0) -> XCUIApplication {
        let app = XCUIApplication()
        setupScreenshots(app) // forwards -AppleLanguages / -AppleLocale
        app.launchArguments += [
            "-CapacitorStorage.ui_test_mode", "1",
            "-CapacitorStorage.ui_test_start_route", route,
        ]
        if openCard {
            app.launchArguments += ["-CapacitorStorage.ui_test_open_card", "1"]
        }
        app.launch()

        XCTAssertTrue(
            app.webViews.firstMatch.waitForExistence(timeout: 30),
            "Capacitor web view never appeared"
        )
        Thread.sleep(forTimeInterval: settle)
        return app
    }

    func testScreenshot00_home() throws {
        // The card wallet — logos load over the network, so give it a moment.
        _ = launch(route: "/", settle: 4.0)
        takeScreenshot("testScreenshot00_home")
    }

    func testScreenshot01_cardDetail() throws {
        // The money shot: a card's barcode ready to scan at checkout.
        _ = launch(route: "/", openCard: true, settle: 4.0)
        takeScreenshot("testScreenshot01_cardDetail")
    }

    func testScreenshot02_createCard() throws {
        _ = launch(route: "/create-card", settle: 4.0)
        takeScreenshot("testScreenshot02_createCard")
    }

    func testScreenshot03_settings() throws {
        _ = launch(route: "/settings")
        takeScreenshot("testScreenshot03_settings")
    }
}
