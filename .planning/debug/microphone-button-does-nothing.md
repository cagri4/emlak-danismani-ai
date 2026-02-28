---
status: diagnosed
trigger: "Investigate why the microphone button in the chat interface does nothing when held/pressed"
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:00:00Z
---

## Current Focus

hypothesis: THREE compounding bugs: (1) hardcoded MIME type crashes MediaRecorder on Safari/Firefox, (2) the transcribeVoice Firebase function requires auth but voiceCommands.ts never passes an auth token (httpsCallable does handle this automatically via Firebase SDK - actually OK), (3) PRIMARY: audio/webm;codecs=opus is not supported on iOS Safari/some Firefox versions, causing MediaRecorder constructor to throw, which is silently caught and sets error="Mikrofon izni reddedildi" - making it look like a permissions error
test: read all involved files completely
expecting: root cause confirmed from code analysis
next_action: DONE - diagnose-only mode, returning structured result

## Symptoms

expected: Press and hold microphone button -> recording starts with visual pulsing indicator -> release -> transcription -> text appears in input
actual: Nothing happens when button is held/pressed - no visual feedback, no recording indicator, no error shown
errors: None visible to user
reproduction: Press and hold mic button in chat interface on any browser
started: Unknown - possibly since Whisper/VoiceCommandInput refactor

## Eliminated

- hypothesis: VoiceButton not connected to VoiceCommandInput
  evidence: VoiceButton.tsx line 19 directly renders <VoiceCommandInput onTranscript={onTranscript} /> - connection is fine
  timestamp: 2026-02-28

- hypothesis: Event handlers missing from button
  evidence: VoiceCommandInput.tsx lines 86-89 attach onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd to the Button - all present
  timestamp: 2026-02-28

- hypothesis: Firebase function not exported/registered
  evidence: functions/src/index.ts line 14 exports transcribeVoice, functions/src/voice/transcribeVoice.ts line 31 defines it - deployed correctly
  timestamp: 2026-02-28

- hypothesis: Firebase httpsCallable missing auth token
  evidence: The Firebase SDK's httpsCallable automatically attaches the current user's ID token when a user is logged in. voiceCommands.ts uses getFunctions(app) which inherits the auth state. This is handled transparently by the Firebase SDK.
  timestamp: 2026-02-28

## Evidence

- timestamp: 2026-02-28
  checked: src/components/chat/VoiceButton.tsx (lines 1-20)
  found: VoiceButton is a thin wrapper that (a) checks MediaRecorder exists, (b) renders VoiceCommandInput directly. No hold-to-record logic here - it's all in VoiceCommandInput.
  implication: If MediaRecorder check on line 14 fails (undefined), returns null silently = button disappears entirely

- timestamp: 2026-02-28
  checked: src/components/voice/VoiceCommandInput.tsx (lines 45-69)
  found: handleMouseDown calls startRecording(); handleMouseUp calls stopRecording(); onMouseLeave also calls stopRecording(). Touch events also wired. This is correct hold-to-speak logic.
  implication: UI event wiring is correct on its own

- timestamp: 2026-02-28
  checked: src/hooks/useVoiceCommand.ts (lines 28-71) startRecording function
  found: BUG #1 - Line 43-45: MediaRecorder is constructed with hardcoded mimeType 'audio/webm;codecs=opus'. This MIME type is NOT supported on iOS Safari (which uses audio/mp4) and may fail on some Firefox versions. When new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }) is called with an unsupported type, it throws a NotSupportedError. This is caught by the catch block on line 68 which sets error to 'Mikrofon izni reddedildi' (microphone permission denied) - a MISLEADING error message.
  implication: On Safari/iOS or any browser where audio/webm;codecs=opus is unsupported, startRecording() throws immediately after getting the stream, and the catch block fires. The user sees nothing (or possibly a brief error tooltip if they look carefully) because the error is displayed below the button in a small tooltip that may be off-screen.

- timestamp: 2026-02-28
  checked: src/hooks/useVoiceCommand.ts (lines 68-70)
  found: BUG #2 (secondary) - The catch block on line 68-70 catches ALL errors from the entire try block with a single message: 'Mikrofon izni reddedildi'. This means a MediaRecorder MIME type error, a getUserMedia permission denial, and any other error all produce the same message. The actual error is swallowed.
  implication: Developer/user cannot distinguish between permission denied and MIME type not supported - makes debugging invisible

- timestamp: 2026-02-28
  checked: src/hooks/useVoiceCommand.ts (lines 58-67) - the auto-stop timer
  found: STALE CLOSURE - startRecording's useCallback has deps:[] (line 71). Inside the setInterval, it calls stopRecording(). stopRecording also has deps:[] (line 112). Since both use refs (not state) internally, the stale closure doesn't actually cause incorrect behavior here - refs are stable. This is NOT a bug.
  implication: No issue with the timer auto-stop

- timestamp: 2026-02-28
  checked: functions/src/voice/transcribeVoice.ts (lines 38-41)
  found: BUG #3 (backend) - The Firebase function requires request.auth (line 39). If the user is NOT authenticated (or Firebase auth hasn't initialized yet), calling this function will throw HttpsError('unauthenticated'). However, voiceCommands.ts does NOT check if user is authenticated before calling httpsCallable. The Firebase SDK does attach auth tokens automatically, but only if the user IS logged in.
  implication: If chat is accessible to unauthenticated users (or during auth loading), transcription will fail with 'unauthenticated' error from Firebase. This would manifest as the recording working but transcription silently failing.

- timestamp: 2026-02-28
  checked: src/services/voiceCommands.ts (full file)
  found: No authentication check before calling httpsCallable. Uses getFunctions(app, 'europe-west1') correctly. The Firebase SDK will attach the auth token automatically IF a user is signed in.
  implication: Works fine when user is authenticated; fails silently when not authenticated

- timestamp: 2026-02-28
  checked: VoiceCommandInput.tsx error display (lines 121-126)
  found: Error is shown as a small tooltip below the button: absolute positioned, small text (text-xs), only visible when error state is set. If the button is near the bottom of the screen (likely in a chat input bar), this tooltip may render off-screen or be clipped by the parent container overflow.
  implication: Even when an error DOES occur and IS set, the user may never see it - making the feature appear to "do nothing"

## Resolution

root_cause: |
  THREE compounding bugs, all contributing to the "does nothing" symptom:

  PRIMARY BUG - Hardcoded unsupported MIME type (useVoiceCommand.ts:43-44):
  MediaRecorder is created with mimeType: 'audio/webm;codecs=opus'. On iOS Safari,
  this MIME type is unsupported and the constructor throws NotSupportedError immediately.
  The catch block (line 68) catches this and sets error='Mikrofon izni reddedildi'
  (wrong message - this is a MIME type error, not a permissions error). The recording
  never starts, but no visible feedback is shown to the user.

  SECONDARY BUG - Generic catch block hides real error (useVoiceCommand.ts:68-70):
  ALL errors in startRecording() produce the same misleading message. The actual
  error (NotSupportedError for MIME type, NotAllowedError for permissions) is lost.

  TERTIARY BUG - Error tooltip may be off-screen (VoiceCommandInput.tsx:121-126):
  The error is displayed as an absolutely-positioned element below the button.
  In a chat input bar at the bottom of the screen, this renders off-screen and
  the user never sees it - making any error completely invisible.

  ADDITIONAL RISK - No auth check before transcription (voiceCommands.ts):
  The Firebase function requires authentication (transcribeVoice.ts:39). If the
  user is not authenticated, transcription will fail with 'unauthenticated'.
  Recording itself would work but transcription would silently fail.

fix: NOT APPLIED (research-only mode)
verification: NOT APPLIED
files_changed: []
