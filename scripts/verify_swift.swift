import Foundation

@main struct Verify {
    static func main() throws {
        let start = Date(timeIntervalSince1970: 1780218000.123456)
        let source = "Apple Watch"
        let sample = HealthQuantitySampleDTO(uuid: UUID(), type: .oxygenSaturation, value: 0.975, unit: .fraction, startAt: start, endAt: start.addingTimeInterval(0.2), sourceName: source, sourceBundleIdentifier: "com.apple.health", metadata: ["original_epoch": String(start.timeIntervalSince1970)])
        let metric = try HealthNormalizer().metrics(from: [sample])[0]
        precondition(metric.type == "oxygen_saturation")
        precondition(metric.value == 0.975) // Registry uses fraction; do not silently scale.
        precondition(metric.sourceName == source && metric.endAt > metric.startAt)
        let roundtrip = try PayloadJSON.decoder.decode(HealthMetric.self, from: PayloadJSON.encoder.encode(metric))
        precondition(roundtrip.metadata == metric.metadata)
        precondition(abs(roundtrip.startAt.timeIntervalSince(start)) < 0.001)
        for (type, unit, value) in [(HealthDataType.heartRate, HealthSampleUnit.countPerMinute, 61.0), (.hrvSDNN, .millisecond, 42.5), (.respiratoryRate, .countPerMinute, 14.0)] {
            let dto = HealthQuantitySampleDTO(uuid: UUID(), type: type, value: value, unit: unit, startAt: start, endAt: start, sourceName: source, sourceBundleIdentifier: "com.apple.health", metadata: [:])
            let result = try HealthNormalizer().metrics(from: [dto])[0]
            precondition(result.value == value)
        }
        let sleep = HealthSleepSampleDTO(uuid: UUID(), startAt: start, endAt: start.addingTimeInterval(120.25), sourceName: source, sourceBundleIdentifier: "com.apple.health", stage: "rem", metadata: [:])
        let sleepMetric = HealthNormalizer().sleepMetrics(from: [sleep])[0]
        precondition(sleepMetric.value == 120.25 && sleepMetric.metadata["sleep_stage"] == "rem")
        let payload = try HealthNormalizer().payload(deviceID: "SYNTHETIC-SWIFT-CONTRACT", dateRange: SyncDateRange(start: start, end: start.addingTimeInterval(120.25)), timezone: "Asia/Shanghai", quantitySamples: [sample], sleepSamples: [sleep], workoutSamples: [], generatedAt: start)
        precondition(payload.schemaVersion == 2)
        if let path = ProcessInfo.processInfo.environment["HEALTHBRIDGE_CONTRACT_OUTPUT"] {
            try PayloadJSON.encoder.encode(payload).write(to: URL(fileURLWithPath: path))
        }
        print("Swift raw sample + source + timestamp + JSON roundtrip passed; SpO2 unit: \(metric.unit)")
    }
}
