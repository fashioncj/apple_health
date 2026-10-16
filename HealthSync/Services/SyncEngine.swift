import Foundation

protocol BatchPersisting {
    func enqueueBatch(_ batch: SyncBatch) async throws
    func pendingBatches() async throws -> [SyncBatch]
    func markBatchUploaded(id: UUID, result: UploadResult) async throws
    func markBatchFailed(id: UUID, errorMessage: String) async throws
    func appendLog(_ log: SyncLogEntry) async throws
    func recordSyncAttempt(at date: Date) async throws
    func recordSyncSuccess(at date: Date) async throws
}

struct SyncRunResult: Equatable {
    let uploadedCount: Int
    let failedCount: Int
    let messages: [String]

    static let empty = SyncRunResult(uploadedCount: 0, failedCount: 0, messages: [])
}

actor SyncEngine {
    private let store: BatchPersisting
    private let uploader: SyncUploading
    private var isUploading = false

    init(store: BatchPersisting, uploader: SyncUploading = APIClient()) {
        self.store = store
        self.uploader = uploader
    }

    @discardableResult
    func queue(payload: SyncPayload) async throws -> SyncBatch {
        let batch = SyncBatch(payload: payload)
        try await store.enqueueBatch(batch)
        try await store.appendLog(
            SyncLogEntry(
                level: .info,
                message: "Queued \(payload.metrics.count) metrics, \(payload.workouts.count) workouts, and \(payload.deletions.count) deletions."
            )
        )
        return batch
    }

    func uploadPending(configuration: UploadConfiguration) async -> SyncRunResult {
        guard !isUploading else { return .empty }
        isUploading = true
        defer { isUploading = false }

        do {
            let pending = try await store.pendingBatches()
            return await upload(batches: pending, configuration: configuration)
        } catch {
            let message = safeMessage(from: error, token: configuration.token)
            try? await store.appendLog(SyncLogEntry(level: .error, message: message))
            return SyncRunResult(uploadedCount: 0, failedCount: 1, messages: [message])
        }
    }

    func uploadQueuedBatch(_ batch: SyncBatch, configuration: UploadConfiguration) async -> SyncRunResult {
        guard !isUploading else { return .empty }
        isUploading = true
        defer { isUploading = false }

        return await upload(batches: [batch], configuration: configuration)
    }

    private func upload(batches: [SyncBatch], configuration: UploadConfiguration) async -> SyncRunResult {
        let attemptedAt = Date()
        do {
            try await store.recordSyncAttempt(at: attemptedAt)
            guard !batches.isEmpty else { return .empty }

            var uploaded = 0
            var failed = 0
            var messages: [String] = []

            for batch in batches {
                if Task.isCancelled {
                    failed += 1
                    messages.append("Sync cancelled. Queued uploads will retry.")
                    break
                }
                do {
                    let result = try await uploader.upload(batch: batch, configuration: configuration)
                    guard result.ok else { throw APIClientError.invalidResponse }
                    try await store.markBatchUploaded(id: batch.id, result: result)
                    try await store.recordSyncSuccess(at: Date())
                    uploaded += 1
                    let workspaceDetail = result.workspaceID.map { " to workspace \($0)" } ?? ""
                    let message = "Uploaded batch \(batch.payload.exportID.uuidString)\(workspaceDetail) (\(result.received) received, \(result.duplicates) duplicates, \(result.deleted) deleted)."
                    messages.append(message)
                    try await store.appendLog(SyncLogEntry(level: .success, message: message))
                } catch {
                    if error is CancellationError || (error as? URLError)?.code == .cancelled {
                        failed += 1
                        messages.append("Sync cancelled. Queued uploads will retry.")
                        break
                    }
                    failed += 1
                    let message = safeMessage(from: error, token: configuration.token)
                    messages.append(message)
                    try? await store.markBatchFailed(id: batch.id, errorMessage: message)
                    try? await store.appendLog(SyncLogEntry(level: .error, message: message))
                }
            }

            return SyncRunResult(uploadedCount: uploaded, failedCount: failed, messages: messages)
        } catch {
            let message = safeMessage(from: error, token: configuration.token)
            try? await store.appendLog(SyncLogEntry(level: .error, message: message))
            return SyncRunResult(uploadedCount: 0, failedCount: 1, messages: [message])
        }
    }

    private func safeMessage(from error: Error, token: String) -> String {
        var message: String
        if let apiError = error as? APIClientError {
            message = apiError.userMessage
        } else {
            message = error.localizedDescription
        }
        if !token.isEmpty {
            message = message.replacingOccurrences(of: token, with: "[redacted]")
        }
        return message
    }
}

actor IncrementalSyncRunner {
    private let store: SQLiteLocalStore
    private let reader: HealthKitSyncReading
    private let engine: SyncEngine

    init(store: SQLiteLocalStore, reader: HealthKitSyncReading, uploader: SyncUploading = APIClient(maxAttempts: 1)) {
        self.store = store
        self.reader = reader
        self.engine = SyncEngine(store: store, uploader: uploader)
    }

    func run(types: Set<HealthDataType>, configuration: UploadConfiguration, now: Date = Date(), calendar: Calendar = .current) async throws {
        try Task.checkCancellation()
        try await store.splitOversizedPendingBatches(maxRecords: 100)
        var anchors: [HealthDataType: String] = [:]
        for type in types {
            anchors[type] = try await store.loadAnchor(for: type)
        }
        let result: HealthKitIncrementalResult
        do {
            result = try await reader.fetchIncremental(types: types, anchors: anchors)
        } catch {
            try Task.checkCancellation()
            try? await retryPending(configuration: configuration, now: now, calendar: calendar)
            throw error
        }
        try Task.checkCancellation()
        let batches = try await queue(result.fetchResult, deletions: result.deletions, configuration: configuration,
            range: SyncDateRange(start: now, end: now), timezone: calendar.timeZone.identifier)
        if batches.isEmpty {
            try await store.appendLog(SyncLogEntry(level: .info, message: HealthSyncUserMessages.noNewSamplesFound))
        }
        for (type, anchor) in result.anchors {
            try await store.saveAnchor(anchor, for: type)
        }
        try await upload(batches, configuration: configuration)

        let recentTypes = types.intersection([.stepCount, .sleepAnalysis, .workouts])
        if !recentTypes.isEmpty,
           try await store.claimDailyMaintenance("recent_samples", now: now, calendar: calendar) {
            let start = calendar.date(byAdding: .day, value: -3, to: calendar.startOfDay(for: now))!
            let recent = try await reader.fetchSamples(types: recentTypes, start: start, end: now)
            try Task.checkCancellation()
            let recentBatches = try await queue(recent, deletions: [], configuration: configuration,
                range: SyncDateRange(start: start, end: now), timezone: calendar.timeZone.identifier)
            try await upload(recentBatches, configuration: configuration)
        }
        try await retryPending(configuration: configuration, now: now, calendar: calendar)
    }

    private func queue(_ samples: HealthKitFetchResult, deletions: [HealthRecordDeletion], configuration: UploadConfiguration,
                       range: SyncDateRange, timezone: String) async throws -> [SyncBatch] {
        let payload = try HealthNormalizer().payload(deviceID: configuration.deviceID, dateRange: range, timezone: timezone,
            quantitySamples: samples.quantitySamples, sleepSamples: samples.sleepSamples, categorySamples: samples.categorySamples,
            workoutSamples: samples.workoutSamples, deletions: deletions)
        guard !payload.isEmpty else { return [] }
        try Task.checkCancellation()
        let batches = try await store.enqueuePayloadChunks(payload, maxRecords: 100)
        try await store.appendLog(SyncLogEntry(level: .info,
            message: "Queued \(payload.metrics.count) metrics, \(payload.workouts.count) workouts, and \(payload.deletions.count) deletions."))
        return batches
    }

    private func upload(_ batches: [SyncBatch], configuration: UploadConfiguration) async throws {
        for batch in batches {
            try Task.checkCancellation()
            let result = await engine.uploadQueuedBatch(batch, configuration: configuration)
            try Task.checkCancellation()
            try BackfillSync.validateUpload(result)
        }
    }

    private func retryPending(configuration: UploadConfiguration, now: Date, calendar: Calendar) async throws {
        let pending = try await store.pendingBatches()
        let unattempted = Array(pending.filter { $0.attemptCount == 0 }.prefix(3))
        try await upload(unattempted, configuration: configuration)
        if let stale = pending.first(where: { $0.attemptCount > 0 }),
           try await store.claimDailyMaintenance("stale_batch", now: now, calendar: calendar) {
            try await upload([stale], configuration: configuration)
        }
    }
}
