// swift-tools-version: 6.1

import PackageDescription

let package = Package(
    name: "OmniXMac",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(
            name: "OmniXMac",
            targets: ["OmniXMac"]
        )
    ],
    targets: [
        .executableTarget(
            name: "OmniXMac",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("BareSlashRegexLiterals")
            ]
        )
    ]
)
