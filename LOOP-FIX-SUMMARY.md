# Loop Bug Fix Summary

## Problem Identified

The application was experiencing a catastrophic infinite loop with the following error sequence:

1. **429 (Too Many Requests)**: Token refresh rate limits
2. **406 (Not Acceptable)**: Multiple rows returned when expecting single row (PGRST116)
3. **401 (Unauthorized)**: RLS policy violations due to expired session
4. **Exponential Request Growth**: Recursive retries causing cascading failures

### Root Causes

1. **Duplicate Database Records**: Multiple `user_settings` records existed for the same `user_id`, violating the UNIQUE constraint
2. **Infinite Recursion**: `updateUserPreferences()` recursively called itself when no data was returned (lines 168-170)
3. **Missing Authentication Validation**: No session validation before database operations
4. **Concurrent Save Operations**: Two separate `useEffect` hooks triggered simultaneous save operations
5. **No Circuit Breaker**: Failed requests continued to retry indefinitely

## Fixes Implemented

### 1. Database Migration: Cleanup Duplicate Records

**File**: `supabase/migrations/[timestamp]_cleanup_duplicate_user_settings.sql`

- Identifies and removes duplicate `user_settings` records
- Keeps only the most recent record per `user_id` (based on `updated_at`)
- Verifies and enforces UNIQUE constraint on `user_id`
- Provides detailed logging of cleanup process

**Key Features**:
- Safe deletion using temporary table
- Preserves data integrity
- Final verification to ensure no duplicates remain
- Automatic constraint enforcement

### 2. Fixed Infinite Recursion

**File**: `services/userProfileService.ts`

**Changes to `updateUserPreferences()`**:
- Removed dangerous recursive call at lines 168-170
- Added check for empty update data (returns null immediately)
- Changed to single retry attempt instead of infinite recursion
- Added proper error handling for authentication failures (42501)
- Added detection of duplicate record errors (PGRST116)

**Before**:
```typescript
if (!data) {
  await getOrCreateUserSettings(userId);
  return await updateUserPreferences(userId, columnPreferences, privacySettings); // ❌ Infinite recursion
}
```

**After**:
```typescript
if (!data) {
  const settings = await getOrCreateUserSettings(userId);
  if (!settings) {
    console.error('Failed to create user settings for userId:', userId);
    return null; // ✅ Early exit
  }

  // ✅ Single retry attempt, no recursion
  const { data: retryData, error: retryError } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  return retryData;
}
```

### 3. Added Authentication Validation Guards

**New File**: `utils/authUtils.ts`

Created comprehensive authentication validation utilities:
- `validateSession()`: Validates user and session object
- `isAuthenticationError()`: Detects auth-related errors (42501, 401, etc.)
- `isRateLimitError()`: Detects rate limit errors (429)
- `isDuplicateRecordError()`: Detects duplicate record errors (PGRST116)

**Features**:
- Checks for user object presence
- Validates session object
- Verifies access token exists
- Checks for session expiration
- Returns detailed validation reasons

### 4. Consolidated SettingsContext Logic

**File**: `context/SettingsContext.tsx`

**Key Changes**:
- Added `session` from `useAuth()` context
- Added `isSavingRef` flag to prevent concurrent operations
- Merged two separate `useEffect` hooks into single consolidated hook
- Added session validation before all database operations
- Implemented double-check validation pattern (before and during save)

**Before**: Two separate hooks triggering concurrent saves
```typescript
useEffect(() => {
  // Save column preferences
}, [visibleColumns, user, userId]);

useEffect(() => {
  // Save privacy settings
}, [hideNSSIdentifier, user, userId]);
```

**After**: Single consolidated hook with session validation
```typescript
useEffect(() => {
  // ✅ Session validation
  const validation = validateSession(user, session);
  if (!validation.isValid) {
    console.warn(`Session validation failed: ${validation.reason}`);
    return;
  }

  // ✅ In-flight check
  if (isSavingRef.current) return;

  // ✅ Debounced save with revalidation
  saveTimeoutRef.current = setTimeout(async () => {
    const revalidation = validateSession(user, session);
    if (!revalidation.isValid) return;

    isSavingRef.current = true;
    try {
      await updateUserPreferences(user.id, visibleColumns, { hideNSSIdentifier });
    } finally {
      isSavingRef.current = false;
    }
  }, 500);
}, [visibleColumns, hideNSSIdentifier, user, session, userId]);
```

### 5. Enhanced Error Handling

**Files Modified**:
- `services/userProfileService.ts`
- `context/SettingsContext.tsx`

**Improvements**:
- All database functions wrapped in try-catch blocks
- Specific error code handling (42501, PGRST116, 23505)
- Detailed error logging with context
- Early exit on authentication errors
- No retry on auth failures (prevents cascading errors)

**Example**:
```typescript
try {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) {
    if (error.code === '42501') {
      console.error('Authentication error: User session may be expired.');
      return null; // ✅ Stop immediately, don't retry
    }
    if (error.code === '23505') {
      return await getUserSettings(userId); // ✅ Safe fallback
    }
    console.error('Error creating user settings:', error);
    return null;
  }

  return data;
} catch (err) {
  console.error('Unexpected error:', err);
  return null;
}
```

## Testing and Verification

### Build Status
✅ Project builds successfully with no errors
✅ All TypeScript type checks pass
✅ No circular dependencies detected

### Expected Behavior After Fixes

1. **No More Infinite Loops**: Maximum of 1 retry attempt on failed updates
2. **Session Validation**: All database operations validate session before executing
3. **Single Save Operation**: Debounced saves prevent concurrent database writes
4. **Proper Error Handling**: Authentication errors stop execution immediately
5. **Clean Database**: No duplicate records in `user_settings` table

### How to Verify Fixes

1. **Check Database**:
   ```sql
   SELECT user_id, COUNT(*) as count
   FROM user_settings
   GROUP BY user_id
   HAVING COUNT(*) > 1;
   ```
   Should return 0 rows (no duplicates)

2. **Monitor Console**:
   - No 429 errors (rate limits)
   - No 406 errors (multiple rows)
   - Session validation warnings instead of cascading failures

3. **Test User Actions**:
   - Toggle column visibility → Should see single debounced save
   - Toggle NSS hiding → Should see single debounced save
   - Change API key → Should validate session before saving

## Prevention Measures

### Circuit Breakers in Place
- ✅ Maximum 1 retry attempt (no infinite recursion)
- ✅ In-flight flag prevents concurrent saves
- ✅ Session validation stops expired token operations
- ✅ Early exit on authentication errors

### Monitoring Points
- Check console for session validation warnings
- Monitor for authentication error codes (42501, 401)
- Watch for PGRST116 errors (indicates database issue)
- Track retry attempts in logs

### Future Improvements
1. Add exponential backoff for transient errors (network issues)
2. Implement user-facing error notifications
3. Add automatic logout on repeated auth failures
4. Consider adding request queue with priority
5. Add telemetry to track error rates

## Files Modified

### Created
- `supabase/migrations/[timestamp]_cleanup_duplicate_user_settings.sql`
- `utils/authUtils.ts`
- `LOOP-FIX-SUMMARY.md` (this file)

### Modified
- `services/userProfileService.ts`
- `context/SettingsContext.tsx`

## Summary

The infinite loop bug was caused by a perfect storm of issues: duplicate database records, infinite recursion, missing authentication validation, and concurrent save operations. The fixes implement:

1. Database cleanup and constraint enforcement
2. Recursive call elimination with single retry
3. Comprehensive session validation
4. Consolidated debounced saves with in-flight protection
5. Robust error handling with early exits

These changes eliminate the exponential request growth, prevent rate limit cascades, and ensure graceful degradation when authentication fails.
