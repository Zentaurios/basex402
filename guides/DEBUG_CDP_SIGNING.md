# 🔍 CDP Signing Debug Guide

## What Was Added

I've instrumented `/src/hooks/useX402Signer.ts` with comprehensive debugging to diagnose the "EVM account not found" error when signing with CDP embedded wallet.

## Debug Instrumentation Added

### 1. **CDP Address Deep Inspection** (runs on mount/change)
```
🔍 === CDP ADDRESS DEEP INSPECTION ===
```
This logs whenever the CDP address changes and shows:
- Raw value
- Type (string vs object)
- Constructor name
- JSON representation
- All object keys (if it's an object)

**What to look for:**
- Is `cdpAddress` actually a string like `"0x44F6..."` or is it an object?
- Does it have a `toString()` method?
- What's the constructor name?

### 2. **CDP Sign Function Inspection** (runs on mount/change)
```
🔍 === CDP SIGN FUNCTION INSPECTION ===
```
This logs details about the `cdpSignTypedData` function:
- Whether it exists
- Its type
- Function name
- First 200 chars of the function string

**What to look for:**
- Is the function properly defined?
- What's the function's name?

### 3. **Pre-Sign Deep Inspection** (runs before each signing attempt)
```
🔍 === PRE-SIGN DEBUG START ===
```
This logs right before calling `cdpSignTypedData()`:
- The exact `cdpAddress` value being passed
- The sign function details
- The full typed data structure being signed

**What to look for:**
- What exact value is being passed as `evmAccount`?
- Is the typed data structure correct?
- Any type mismatches?

### 4. **Post-Sign Success Debug** (if signing succeeds)
```
🔍 === POST-SIGN DEBUG ===
```
This logs if signing succeeds:
- The signature result
- Result type and structure

### 5. **Enhanced Error Debug** (if signing fails)
```
🔍 === ERROR DEBUG START ===
```
This logs detailed error information:
- Error message
- Error stack trace
- Error name and constructor
- All error properties
- JSON serialization of the error

**What to look for:**
- The exact error message
- Any additional error properties
- Error stack trace

## How to Test

1. **Start the dev server:**
   ```bash
   cd /Users/Ryan/builds/x402-contract-deployer
   npm run dev
   ```

2. **Open the app** and connect with CDP embedded wallet

3. **Try to mint** NFTs

4. **Check the browser console** for the debug output

## What We're Looking For

The key question is: **What format does CDP expect for the `evmAccount` parameter?**

Based on the error "EVM account not found", possible issues:
1. `cdpAddress` is an object but CDP expects a string
2. `cdpAddress` is a string but needs conversion/formatting
3. `cdpAddress` is correct but `cdpSignTypedData` needs the account in a different format
4. The CDP hooks aren't properly initialized

## Next Steps Based on Debug Output

### If `cdpAddress` is an object:
Try passing `cdpAddress.address` or `cdpAddress.toString()` instead

### If `cdpAddress` is a string:
The issue might be with how CDP is initialized or the account needs to be fetched differently

### If the function signature is wrong:
We may need to import and call CDP signing differently

### If CDP hooks aren't initialized:
We may need to ensure CDP is fully loaded before attempting to sign

## Share These Logs

When you run this and try to mint, please share:
1. The output from "🔍 === CDP ADDRESS DEEP INSPECTION ==="
2. The output from "🔍 === CDP SIGN FUNCTION INSPECTION ==="
3. The output from "🔍 === PRE-SIGN DEBUG START ==="
4. The full output from "🔍 === ERROR DEBUG START ==="

This will tell us exactly what CDP is receiving and what format it expects! 🎯
