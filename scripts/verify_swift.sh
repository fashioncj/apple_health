#!/bin/sh
# Runs the actual Swift normalization/serialization code on macOS, without Xcode plugins.
set -eu
cd "$(dirname "$0")/.."
verification_dir=$(mktemp -d)
trap 'rm -rf "$verification_dir"' EXIT
xcode_root=$(xcode-select -p)
"$xcode_root/Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc" \
  -sdk "$xcode_root/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk" \
  -target arm64-apple-macosx14.0 -module-cache-path "$verification_dir/cache" \
  HealthSync/Models/HealthMetric.swift HealthSync/Models/HealthWorkout.swift \
  HealthSync/Models/SyncBatch.swift HealthSync/Services/HealthNormalizer.swift \
  scripts/verify_swift.swift -o "$verification_dir/verify"
"$verification_dir/verify"
